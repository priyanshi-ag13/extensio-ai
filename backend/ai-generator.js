// backend/ai-generator.js - UPDATED with ZIP packaging!
// Now generates, saves, AND zips Chrome extensions automatically
// Day 3 - Commit 6: Integrated ZIP packaging with AI

const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Import our modules
const fileSaver = require('./file-saver');
const zipPackager = require('./zip-packager');  // NEW!

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

Remember: Output ONLY the JSON. Start with { and end with {.`;

// Function to get code from AI
async function getExtensionCode(userRequest) {
    console.log("\n🤖 Contacting AI...");
    console.log("📝 Your request:", userRequest);
    
    try {
        const aiModel = aiClient.getGenerativeModel({ model: "gemini-2.5-flash" });
        const fullPrompt = mySpecialPrompt + "\n\nUSER WANTS: " + userRequest;
        console.log("⏳ AI is thinking (5-10 seconds)...");
        
        const result = await aiModel.generateContent(fullPrompt);
        let responseText = result.response.text();
        
        console.log("✅ Received response from AI!");
        
        // Clean the response
        responseText = responseText.trim();
        if (responseText.startsWith("```json")) {
            responseText = responseText.replace("```json", "").replace("```", "");
        }
        if (responseText.startsWith("```")) {
            responseText = responseText.replace("```", "").replace("```", "");
        }
        
        // Parse JSON
        const extensionCode = JSON.parse(responseText);
        console.log("✅ JSON is valid!");
        return extensionCode;
        
    } catch (error) {
        console.log("❌ Error:", error.message);
        return null;
    }
}

// NEW: Generate, save, AND create ZIP!
async function generateAndZipExtension(userRequest) {
    console.log("\n" + "🌟".repeat(15));
    console.log("EXTENSIO.AI - GENERATE & ZIP");
    console.log("🌟".repeat(15));
    
    // Step 1: Get code from AI
    const extensionCode = await getExtensionCode(userRequest);
    
    if (!extensionCode) {
        console.log("\n❌ Failed to generate extension. Please try again.");
        return false;
    }
    
    // Step 2: Check required files
    const requiredFiles = ['manifest.json', 'content.js', 'popup.html'];
    const hasAllFiles = requiredFiles.every(file => extensionCode[file]);
    
    if (!hasAllFiles) {
        console.log("\n⚠️ Warning: Missing files!");
        console.log("Files received:", Object.keys(extensionCode));
    }
    
    // Step 3: Create folder and save files
    const timestamp = Date.now();
    const folderName = `generated-extension-${timestamp}`;
    
    console.log("\n💾 Saving files...");
    const saved = fileSaver.saveExtensionFiles(extensionCode, folderName);
    
    if (!saved) {
        console.log("\n❌ Failed to save files.");
        return false;
    }
    
    // Step 4: Create ZIP file (NEW!)
    console.log("\n📦 Creating ZIP package...");
    try {
        const zipPath = await zipPackager.createTimedZip(folderName);
        console.log(`\n✅ ZIP created successfully!`);
        console.log(`   📍 Location: ${zipPath}`);
        
        // Step 5: Show installation instructions
        console.log("\n" + "=".repeat(60));
        console.log("🎉 EXTENSION READY FOR DOWNLOAD!");
        console.log("=".repeat(60));
        console.log(`\n📦 Download: The ZIP file is saved in the "downloads" folder`);
        console.log(`   File name: ${require('path').basename(zipPath)}`);
        
        // Step 6: Show Chrome installation instructions
        console.log("\n📖 TO INSTALL IN CHROME:");
        console.log("   1. Open Chrome and go to: chrome://extensions");
        console.log("   2. Turn ON 'Developer mode' (top right)");
        console.log("   3. Drag and drop the ZIP file OR click 'Load unpacked'");
        console.log("   4. Select the extracted folder");
        
        // Step 7: Clean up temp folder (optional - for Commit 7)
        // zipPackager.deleteFolder(folderName);
        
        console.log("\n" + "=".repeat(60));
        return true;
        
    } catch (error) {
        console.log("\n❌ Failed to create ZIP:", error.message);
        return false;
    }
}

// Preview of generated code
function showPreview(extensionCode) {
    console.log("\n🔍 CODE PREVIEW:");
    console.log("=".repeat(40));
    
    if (extensionCode["content.js"]) {
        console.log("\n📄 content.js:");
        console.log("-".repeat(20));
        const preview = extensionCode["content.js"].substring(0, 200);
        console.log(preview);
        if (extensionCode["content.js"].length > 200) {
            console.log("... (truncated)");
        }
    }
    
    if (extensionCode["manifest.json"]) {
        console.log("\n📄 manifest.json:");
        console.log("-".repeat(20));
        const preview = extensionCode["manifest.json"].substring(0, 150);
        console.log(preview);
        if (extensionCode["manifest.json"].length > 150) {
            console.log("... (truncated)");
        }
    }
    
    console.log("\n" + "=".repeat(40));
}

// Main function - YOU CAN CHANGE THIS REQUEST!
async function main() {
    // ✏️ CHANGE THIS TEXT to test different extensions!
    const myRequest = "Make a Chrome extension that changes background color to light blue";
    
    const result = await generateAndZipExtension(myRequest);
    
    if (result) {
        console.log("\n✅ COMMIT 6 COMPLETE!");
        console.log("   AI + File Saver + ZIP Packager are working together!");
    } else {
        console.log("\n❌ Something went wrong. Check errors above.");
    }
}

// Run the program
main();