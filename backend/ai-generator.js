// backend/ai-generator.js - WORKING VERSION (May 2026)
// Using the ONLY model that works with free tier: gemini-2.5-flash

const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Get API key from .env file
const myApiKey = process.env.GEMINI_API_KEY;

// Check if API key exists
if (!myApiKey) {
    console.log("❌ Error: No API key found in .env file");
    console.log("Please add: GEMINI_API_KEY=your_key_here");
    process.exit(1);
}

console.log("✅ API Key found! Length:", myApiKey.length);

// Connect to Google AI
const aiClient = new GoogleGenerativeAI(myApiKey);

// Special instructions for AI
const mySpecialPrompt = `You are a Chrome Extension expert. 
Output ONLY valid JSON. No extra text, no explanations, no markdown.

CRITICAL: Your response must be ONLY the JSON object. Nothing before, nothing after.

The JSON must have exactly these 3 files:
- "manifest.json" (Chrome extension settings with manifest_version: 3)
- "content.js" (The JavaScript code that runs on websites)
- "popup.html" (The popup window HTML)

Example for "change background to red":
{
  "manifest.json": "{ \"manifest_version\": 3, \"name\": \"Background Changer\", \"version\": \"1.0\", \"permissions\": [\"activeTab\"], \"content_scripts\": [{ \"matches\": [\"<all_urls>\"], \"js\": [\"content.js\"] }], \"action\": { \"default_popup\": \"popup.html\" } }",
  "content.js": "document.body.style.backgroundColor = 'red';",
  "popup.html": "<!DOCTYPE html><html><head><style>body{width:200px;padding:10px}</style></head><body><h3>Background Changed!</h3></body></html>"
}

Remember: Output ONLY the JSON. Start with { and end with }.`;

// Function to get code from AI
async function getExtensionCode(userRequest) {
    console.log("\n🤖 Generating extension...");
    console.log("📝 Request:", userRequest);
    
    try {
        // ✅ THIS IS THE CORRECT MODEL NAME FOR MAY 2026
        const aiModel = aiClient.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const fullPrompt = mySpecialPrompt + "\n\nUSER WANTS: " + userRequest;
        console.log("⏳ Sending to AI (this takes 5-10 seconds)...");
        
        const result = await aiModel.generateContent(fullPrompt);
        let responseText = result.response.text();
        
        console.log("✅ Got response from AI!");
        
        // Clean the response - remove any markdown code blocks
        responseText = responseText.trim();
        if (responseText.startsWith("```json")) {
            responseText = responseText.replace("```json", "").replace("```", "");
        }
        if (responseText.startsWith("```")) {
            responseText = responseText.replace("```", "").replace("```", "");
        }
        
        // Try to parse as JSON
        const extensionCode = JSON.parse(responseText);
        console.log("✅ Success! AI gave valid JSON");
        return extensionCode;
        
    } catch (error) {
        console.log("❌ Error:", error.message);
        if (error.message.includes("404")) {
            console.log("\n💡 The model name might be wrong. Current working models:");
            console.log("   - gemini-2.5-flash (RECOMMENDED - free tier)");
            console.log("   - gemini-2.5-pro (paid tier)");
        }
        return null;
    }
}

// Function to save files
function saveExtensionFiles(extensionCode, folderName) {
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
    }
    
    for (const [fileName, fileContent] of Object.entries(extensionCode)) {
        const filePath = path.join(folderName, fileName);
        fs.writeFileSync(filePath, fileContent);
        console.log(`💾 Saved: ${fileName}`);
    }
    
    console.log(`\n📁 Files saved to: ${folderName}/`);
}

// Run the test
async function test() {
    console.log("\n" + "🌟".repeat(15));
    console.log("EXTENSIO.AI - WEEK 1 TEST");
    console.log("🌟".repeat(15) + "\n");
    
    const testRequest = "Make a Chrome extension that changes background color to light blue";
    const result = await getExtensionCode(testRequest);
    
    if (result) {
        console.log("\n✅ VERIFICATION PASSED!");
        console.log("📁 Files created:", Object.keys(result));
        
        // Preview the files
        if (result["content.js"]) {
            console.log("\n🔍 Preview of content.js:");
            console.log("=".repeat(40));
            console.log(result["content.js"].substring(0, 200));
            console.log("=".repeat(40));
        }
        
        // Save files to test in Chrome
        const timestamp = Date.now();
        const folderName = `generated-extension-${timestamp}`;
        saveExtensionFiles(result, folderName);
        
        console.log("\n📖 To test in Chrome:");
        console.log("   1. Open Chrome and go to: chrome://extensions");
        console.log("   2. Turn ON 'Developer mode' (top right)");
        console.log("   3. Click 'Load unpacked'");
        console.log("   4. Select the folder:", folderName);
        
    } else {
        console.log("\n❌ VERIFICATION FAILED");
    }
}

// Run the test
test();