// server.js - COMPLETE WORKING VERSION
// Restored to before Commit 34

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Import modules
const connectDB = require('./backend/db');
const authRoutes = require('./backend/routes/auth');
const extensionRoutes = require('./backend/routes/extensions');
const fileSaver = require('./backend/file-saver');
const zipPackager = require('./backend/zip-packager');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.use('/downloads', express.static('downloads'));

// ========== DATABASE ==========
connectDB();

// ========== ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/extensions', extensionRoutes);

// ========== GENERATE ENDPOINT ==========
app.post('/api/generate', async (req, res) => {
    console.log('\n📨 Received generation request');
    
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ 
            success: false, 
            error: 'Prompt is required' 
        });
    }
    
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
    
    try {
        const myApiKey = process.env.GEMINI_API_KEY;
        
        if (!myApiKey) {
            throw new Error('GEMINI_API_KEY not found');
        }
        // In the /api/generate route, after getting the user:
if (user) {
    if (!user.canGenerate()) {
        return res.status(403).json({
            success: false,
            error: 'Free trial limit reached. Subscribe to continue!',
            limitReached: true,
            redirectTo: '/pricing.html'
        });
    }
    // Increment after successful generation
    await user.incrementGenerations();
}
        const aiClient = new GoogleGenerativeAI(myApiKey);
        
        const SYSTEM_PROMPT = `You are a Chrome Extension expert. 
Output ONLY valid JSON. No extra text, no explanations, no markdown.

The JSON must have exactly these 3 files:
- "manifest.json" (Chrome extension settings with manifest_version: 3)
- "content.js" (The JavaScript code that runs on websites)
- "popup.html" (The popup window HTML)

Example output:
{
  "manifest.json": "{ \"manifest_version\": 3, \"name\": \"My Extension\", \"version\": \"1.0\", \"permissions\": [\"activeTab\"], \"content_scripts\": [{ \"matches\": [\"<all_urls>\"], \"js\": [\"content.js\"] }], \"action\": { \"default_popup\": \"popup.html\" } }",
  "content.js": "document.body.style.backgroundColor = 'blue';",
  "popup.html": "<!DOCTYPE html><html><head><style>body{width:200px;padding:10px}</style></head><body><h3>Extension Active!</h3></body></html>"
}`;
        
        const aiModel = aiClient.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await aiModel.generateContent(SYSTEM_PROMPT + "\n\nUSER WANTS: " + prompt);
        let responseText = result.response.text();
        
        // Clean response
        responseText = responseText.trim();
        if (responseText.startsWith("```json")) {
            responseText = responseText.replace("```json", "").replace("```", "");
        }
        if (responseText.startsWith("```")) {
            responseText = responseText.replace("```", "").replace("```", "");
        }
        
        const extensionCode = JSON.parse(responseText);
        
        // Save files and create ZIP
        const timestamp = Date.now();
        const folderName = `generated-extension-${timestamp}`;
        fileSaver.saveExtensionFiles(extensionCode, folderName);
        const zipPath = await zipPackager.createZipAndCleanup(folderName);
        const zipFileName = path.basename(zipPath);
        
        console.log('✅ Extension ready for download!');
        
        res.json({
            success: true,
            downloadUrl: `/downloads/${zipFileName}`,
            files: extensionCode,
            message: 'Extension generated successfully!'
        });
        
    } catch (error) {
        console.error('❌ Generation error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Extensio.ai server is running!' });
});

// ========== SERVE DASHBOARD ==========
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Route not found' 
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║     🚀 EXTENSIO.AI SERVER RUNNING      ║
    ╠════════════════════════════════════════╣
    ║  🌐 URL: http://localhost:${PORT}       ║
    ║  📁 Dashboard: /dashboard.html         ║
    ╚════════════════════════════════════════╝
    `);
});