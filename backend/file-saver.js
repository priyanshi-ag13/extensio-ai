// backend/file-saver.js
// This module saves AI-generated extension code to actual files
// Created: Day 2 of Extensio.ai project

const fs = require('fs');
const path = require('path');

/**
 * Saves extension files to a folder on your computer
 * @param {Object} extensionCode - The JSON object with file names and content
 * @param {string} folderName - Where to save the files (e.g., "my-extension")
 * @returns {boolean} - True if successful, false if error
 */
function saveExtensionFiles(extensionCode, folderName) {
    console.log("\n💾 Starting to save files...");
    
    try {
        // Step 1: Check if folder exists, if not - create it
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName, { recursive: true });
            console.log(`📁 Created new folder: ${folderName}/`);
        } else {
            console.log(`📁 Using existing folder: ${folderName}/`);
        }
        
        // Step 2: Loop through each file in the JSON
        let savedCount = 0;
        let fileList = [];
        
        for (const [fileName, fileContent] of Object.entries(extensionCode)) {
            // Create the full path (folder + filename)
            const fullPath = path.join(folderName, fileName);
            
            // Write the file content to the computer
            fs.writeFileSync(fullPath, fileContent);
            
            console.log(`   ✅ Saved: ${fileName}`);
            savedCount++;
            fileList.push(fileName);
        }
        
        // Step 3: Show summary
        console.log(`\n📊 SUMMARY: ${savedCount} files saved successfully!`);
        console.log(`📂 Location: ${folderName}/`);
        console.log(`📄 Files: ${fileList.join(', ')}`);
        
        return true;
        
    } catch (error) {
        console.log(`❌ ERROR: Failed to save files - ${error.message}`);
        return false;
    }
}

/**
 * Gets the full path of the folder (useful for Chrome installation instructions)
 * @param {string} folderName - The folder name
 * @returns {string} - Full absolute path
 */
function getFullPath(folderName) {
    return path.resolve(folderName);
}

/**
 * Shows instructions for installing the extension in Chrome
 * @param {string} folderName - The folder containing the extension
 */
function showInstallInstructions(folderName) {
    const fullPath = getFullPath(folderName);
    
    console.log("\n" + "=".repeat(60));
    console.log("📖 HOW TO INSTALL YOUR EXTENSION IN CHROME");
    console.log("=".repeat(60));
    console.log("");
    console.log("1️⃣  Open Google Chrome");
    console.log("2️⃣  In the address bar, type: chrome://extensions");
    console.log("3️⃣  Turn ON 'Developer mode' (toggle in top-right corner)");
    console.log("4️⃣  Click 'Load unpacked' button");
    console.log("5️⃣  Select this folder:");
    console.log(`     📂 ${fullPath}`);
    console.log("6️⃣  Your extension is now installed!");
    console.log("7️⃣  Click the puzzle piece icon (extensions menu) to find your extension");
    console.log("");
    console.log("=".repeat(60));
}

// Export the functions so other files can use them
module.exports = { 
    saveExtensionFiles, 
    getFullPath, 
    showInstallInstructions 
};

// For testing this module directly
if (require.main === module) {
    console.log("\n🧪 TESTING FILE SAVER MODULE\n");
    
    // Create a test extension
    const testExtension = {
        "manifest.json": "{ \"manifest_version\": 3, \"name\": \"Test\", \"version\": \"1.0\" }",
        "content.js": "console.log('Test extension loaded!');",
        "popup.html": "<html><body><h1>Test</h1></body></html>"
    };
    
    const testFolder = "test-extension-" + Date.now();
    
    console.log("Testing with sample files...");
    const result = saveExtensionFiles(testExtension, testFolder);
    
    if (result) {
        showInstallInstructions(testFolder);
        console.log("\n✅ MODULE TEST PASSED! File saver is working.");
    } else {
        console.log("\n❌ MODULE TEST FAILED! Check for errors above.");
    }
}