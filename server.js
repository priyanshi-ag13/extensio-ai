// server.js - COMPLETE WORKING VERSION
// Extensio.ai Backend Server with All Features
// Day 7 - Commit 19: Complete with error handling

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const archiver = require('archiver');
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

// ========== DATABASE CONNECTION ==========
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
    
    // Create a timeout promise (30 seconds max)
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI generation timeout after 30 seconds')), 30000);
    });
    
    try {
        const myApiKey = process.env.GEMINI_API_KEY;
        
        if (!myApiKey) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }
        
        const aiClient = new GoogleGenerativeAI(myApiKey);
        
        const SYSTEM_PROMPT = `You are a Chrome Extension expert. 
Output ONLY valid JSON. No extra text, no explanations, no markdown.

CRITICAL: Your response must be ONLY the JSON object. Start with { and end with }.

The JSON must have exactly these 3 files:
- "manifest.json" (Chrome extension settings with manifest_version: 3)
- "content.js" (The JavaScript code that runs on websites)
- "popup.html" (The popup window HTML)

Example output:
{
  "manifest.json": "{ \"manifest_version\": 3, \"name\": \"My Extension\", \"version\": \"1.0\", \"permissions\": [\"activeTab\"], \"content_scripts\": [{ \"matches\": [\"<all_urls>\"], \"js\": [\"content.js\"] }], \"action\": { \"default_popup\": \"popup.html\" } }",
  "content.js": "// Your JavaScript code here\\ndocument.body.style.backgroundColor = 'blue';",
  "popup.html": "<!DOCTYPE html><html><head><style>body{width:200px;padding:10px}</style></head><body><h3>Extension Active!</h3></body></html>"
}`;
        
        const aiModel = aiClient.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        console.log('⏳ Calling AI (this may take 5-10 seconds)...');
        
        // Race between AI and timeout
        const result = await Promise.race([
            aiModel.generateContent(SYSTEM_PROMPT + "\n\nUSER WANTS: " + prompt),
            timeoutPromise
        ]);
        
        let responseText = result.response.text();
        
        // Clean the response
        responseText = responseText.trim();
        if (responseText.startsWith("```json")) {
            responseText = responseText.replace("```json", "").replace("```", "");
        }
        if (responseText.startsWith("```")) {
            responseText = responseText.replace("```", "").replace("```", "");
        }
        
        // Validate JSON before proceeding
        let extensionCode;
        try {
            extensionCode = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError.message);
            console.error('Raw response:', responseText.substring(0, 500));
            throw new Error('AI returned invalid JSON. Please try again.');
        }
        
        // Validate required files
        const requiredFiles = ['manifest.json', 'content.js', 'popup.html'];
        const missingFiles = requiredFiles.filter(f => !extensionCode[f]);
        
        if (missingFiles.length > 0) {
            throw new Error(`AI missing required files: ${missingFiles.join(', ')}`);
        }
        
        console.log('✅ AI generated valid JSON with all required files');
        
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
        
        // Send appropriate error message based on error type
        let errorMessage = error.message;
        if (error.message.includes('API key')) {
            errorMessage = 'Invalid or missing API key. Please check your .env file.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'AI generation timed out. Please try again.';
        } else if (error.message.includes('JSON')) {
            errorMessage = 'AI returned invalid format. Please try a different prompt.';
        } else if (error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        }
        
        res.status(500).json({ 
            success: false, 
            error: errorMessage 
        });
    }
});

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Extensio.ai server is running!' });
});

// ========== SERVE DASHBOARD ==========
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ========== GLOBAL ERROR HANDLER ==========
// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: `Route ${req.method} ${req.url} not found` 
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error. Please try again later.' 
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║     🚀 EXTENSIO.AI SERVER RUNNING SUCCESSFULLY       ║
    ║                                                       ║
    ╠═══════════════════════════════════════════════════════╣
    ║                                                       ║
    ║  🌐 URL:           http://localhost:${PORT}            ║
    ║  📁 Downloads:     /downloads                         ║
    ║  💚 Health Check:  /api/health                        ║
    ║  🔐 Authentication:/api/auth                          ║
    ║  💾 Extensions:    /api/extensions                    ║
    ║  📊 Dashboard:     /dashboard                         ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
    `);
});
// ========== PREVIEW ENDPOINT ==========
app.post('/api/preview', async (req, res) => {
    console.log('\n📸 Generating preview...');
    
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    
    try {
        const myApiKey = process.env.GEMINI_API_KEY;
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const aiClient = new GoogleGenerativeAI(myApiKey);
        
        const previewPrompt = `Based on this description: "${prompt}"
        Generate a brief preview description of what this Chrome extension would look like and how it would work. 
        Include: 
        1. What the extension does (1 sentence)
        2. How the user interacts with it (1 sentence)
        3. What the user sees (1 sentence)
        Keep it under 100 words.`;
        
        const aiModel = aiClient.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await aiModel.generateContent(previewPrompt);
        const previewText = result.response.text();
        
        res.json({
            success: true,
            preview: previewText
        });
        
    } catch (error) {
        console.error('❌ Preview error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});