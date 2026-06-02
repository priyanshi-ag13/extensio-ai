// server.js - Express server for Extensio.ai
// Day 4 - Commit 8: Web server with download endpoint

const express = require('express');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Import our modules
const fileSaver = require('./backend/file-saver');
const zipPackager = require('./backend/zip-packager');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());  // To parse JSON data from frontend
app.use(express.static('public'));  // Serve static files (HTML, CSS, JS)

// Make downloads folder accessible for download
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Initialize AI
const myApiKey = process.env.GEMINI_API_KEY;
const aiClient = new GoogleGenerativeAI(myApiKey);

// System prompt for AI
const SYSTEM_PROMPT = `You are a Chrome Extension expert. 
Output ONLY valid JSON. No extra text, no explanations.

The JSON must have exactly these 3 files:
- "manifest.json" (Chrome extension settings with manifest_version: 3)
- "content.js" (The JavaScript code that runs on websites)
- "popup.html" (The popup window HTML)

Example output format:
{
  "manifest.json": "{ \"manifest_version\": 3, \"name\": \"My Extension\", \"version\": \"1.0\", \"permissions\": [\"activeTab\"], \"content_scripts\": [{ \"matches\": [\"<all_urls>\"], \"js\": [\"content.js\"] }], \"action\": { \"default_popup\": \"popup.html\" } }",
  "content.js": "// Your code here",
  "popup.html": "<html><body><h3>Extension</h3></body></html>"
}`;

// API endpoint: Generate extension
app.post('/api/generate', async (req, res) => {
    console.log('\n' + '='.repeat(50));
    console.log('📨 Received generation request');
    console.log('='.repeat(50));
    
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    
    console.log(`📝 Prompt: ${prompt}`);
    
    try {
        // Step 1: Call AI
        console.log('🤖 Calling AI...');
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
        console.log('✅ AI generated valid JSON');
        
        // Step 2: Save files
        const timestamp = Date.now();
        const folderName = `generated-extension-${timestamp}`;
        fileSaver.saveExtensionFiles(extensionCode, folderName);
        
        // Step 3: Create ZIP with auto-cleanup
        console.log('📦 Creating ZIP...');
        const zipPath = await zipPackager.createZipAndCleanup(folderName);
        
        // Step 4: Get filename for download
        const zipFileName = path.basename(zipPath);
        
        console.log('✅ Extension ready for download!');
        console.log('='.repeat(50));
        
        // Send response with download link
        res.json({
            success: true,
            downloadUrl: `/downloads/${zipFileName}`,
            message: 'Extension generated successfully!'
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Test endpoint to check if server is running
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Extensio.ai server is running!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║     🚀 EXTENSIO.AI SERVER RUNNING      ║
    ╠════════════════════════════════════════╣
    ║  🌐 URL: http://localhost:${PORT}       ║
    ║  📁 Downloads: /downloads              ║
    ║  💚 Health: /api/health                ║
    ╚════════════════════════════════════════╝
    `);
});