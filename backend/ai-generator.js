// backend/ai-generator.js - UPDATED with file saving!
// Now generates AND saves Chrome extensions automatically
// Day 2 - Commit 4: Integrated file saver with AI

const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Import our file saver module from Commit 3
const fileSaver = require('./file-saver');

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

// Special instructions for AI - IMPROVED VERSION
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
        // Using the working model (gemini-2.5-flash)
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
            console.log("\n💡 Model not found. Current working models:");
            console.log("   - gemini-2.5-flash (RECOMMENDED)");
            console.log("   - gemini-2.5-pro");
        }
        return null;
    }
}

// NEW FUNCTION: Generate AND save in one go!
async function generateAndSaveExtension(userRequest) {
    console.log("\n" + "🌟".repeat(15));
    console.log("EXTENSIO.AI - GENERATE & SAVE");
    console.log("🌟".repeat(15));
    
    // Step 1: Get code from AI
    const extensionCode = await getExtensionCode(userRequest);
    
    if (!extensionCode) {
        console.log("\n❌ Failed to generate extension. Please try again.");
        return false;
    }
    
    // Step 2: Check if we have the required files
    const requiredFiles = ['manifest.json', 'content.js', 'popup.html'];
    const hasAllFiles = requiredFiles.every(file => extensionCode[file]);
    
    if (!hasAllFiles) {
        console.log("\n⚠️ Warning: Missing some files!");
        console.log("Files received:", Object.keys(extensionCode));
        console.log("Expected: manifest.json, content.js, popup.html");
    }
    
    // Step 3: Create a unique folder name using timestamp
    const timestamp = Date.now();
    const folderName = `generated-extension-${timestamp}`;
    
    // Step 4: Save the files using our file-saver module
    console.log("\n💾 Saving files to your computer...");
    const saved = fileSaver.saveExtensionFiles(extensionCode, folderName);
    
    if (saved) {
        console.log("\n✅ EXTENSION GENERATED AND SAVED SUCCESSFULLY!");
        
        // Step 5: Show installation instructions
        fileSaver.showInstallInstructions(folderName);
        
        // Step 6: Show preview of what was generated
        console.log("\n🔍 PREVIEW OF GENERATED CODE:");
        console.log("=".repeat(50));
        if (extensionCode["content.js"]) {
            console.log("\n📄 content.js (first 200 characters):");
            console.log("-".repeat(30));
            console.log(extensionCode["content.js"].substring(0, 200));
            if (extensionCode["content.js"].length > 200) {
                console.log("... (truncated)");
            }
        }
        console.log("\n" + "=".repeat(50));
        
        return true;
    }
    
    return false;
}

// Function to test with multiple different requests
async function runMultipleTests() {
    console.log("\n" + "🚀".repeat(10));
    console.log("RUNNING TESTS");
    console.log("🚀".repeat(10));
    
    // Test 1: Simple background color
    console.log("\n📋 TEST 1: Background color changer");
    await generateAndSaveExtension("Make a Chrome extension that changes webpage background to light blue");
    
    // Ask if user wants to test another
    console.log("\n" + "💡".repeat(10));
    console.log("To test another extension, call generateAndSaveExtension() with your own request");
    console.log("Example: generateAndSaveExtension('Make extension that hides all images')");
    console.log("💡".repeat(10));
}

// Run the main test
// You can change this to any request you want!
async function main() {
    // Change this text to whatever extension you want to create!
    const myRequest = "Make a Chrome extension that changes background color to light blue";
    
    await generateAndSaveExtension(myRequest);
}

// Run the program
main();