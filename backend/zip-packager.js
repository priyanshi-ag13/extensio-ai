// backend/zip-packager.js
// Simple ZIP packager using archiver v5 (stable version)
// Day 3 - Commit 5

const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

/**
 * Creates a ZIP file from a folder
 * @param {string} sourceFolder - The folder to zip
 * @param {string} outputZip - The output ZIP file path
 * @returns {Promise} - Resolves when done
 */
function createZip(sourceFolder, outputZip) {
    return new Promise((resolve, reject) => {
        console.log(`\n📦 Creating ZIP file...`);
        console.log(`   Source: ${sourceFolder}/`);
        console.log(`   Output: ${outputZip}`);
        
        // Check if source exists
        if (!fs.existsSync(sourceFolder)) {
            reject(new Error(`Folder not found: ${sourceFolder}`));
            return;
        }
        
        // Create output directory if needed
        const outputDir = path.dirname(outputZip);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Create write stream
        const output = fs.createWriteStream(outputZip);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        // Handle completion
        output.on('close', () => {
            const sizeInKB = (archive.pointer() / 1024).toFixed(2);
            console.log(`   ✅ ZIP created! Size: ${sizeInKB} KB`);
            resolve();
        });
        
        // Handle errors
        archive.on('error', (err) => reject(err));
        output.on('error', (err) => reject(err));
        
        // Pipe and add files
        archive.pipe(output);
        archive.directory(sourceFolder, false);
        archive.finalize();
    });
}

/**
 * Creates a ZIP with timestamp filename
 * @param {string} sourceFolder - Folder to zip
 * @returns {Promise<string>} - Path to created ZIP
 */
async function createTimedZip(sourceFolder) {
    const timestamp = Date.now();
    const zipName = `extension-${timestamp}.zip`;
    const zipPath = path.join(__dirname, '..', 'downloads', zipName);
    
    await createZip(sourceFolder, zipPath);
    return zipPath;
}

/**
 * Delete a folder and all its contents
 * @param {string} folderPath - Folder to delete
 */
function deleteFolder(folderPath) {
    if (!fs.existsSync(folderPath)) return;
    
    console.log(`   🗑️ Deleting: ${folderPath}/`);
    
    const deleteRecursive = (p) => {
        if (fs.existsSync(p)) {
            const files = fs.readdirSync(p);
            for (const file of files) {
                const curPath = path.join(p, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    deleteRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            }
            fs.rmdirSync(p);
        }
    };
    
    try {
        deleteRecursive(folderPath);
        console.log(`   ✅ Deleted successfully`);
    } catch (error) {
        console.log(`   ⚠️ Could not delete: ${error.message}`);
    }
}

module.exports = { createZip, createTimedZip, deleteFolder };

// Test the module
if (require.main === module) {
    console.log("\n" + "🧪".repeat(10));
    console.log("TESTING ZIP PACKAGER");
    console.log("🧪".repeat(10));
    
    const testFolder = "test-zip-folder";
    
    // Create test folder
    if (!fs.existsSync(testFolder)) {
        fs.mkdirSync(testFolder);
        fs.writeFileSync(path.join(testFolder, "manifest.json"), '{"name": "Test"}');
        fs.writeFileSync(path.join(testFolder, "content.js"), 'console.log("Test");');
        fs.writeFileSync(path.join(testFolder, "popup.html"), "<html><body>Test</body></html>");
        console.log(`\n📁 Created test folder with 3 files`);
    }
    
    // Test ZIP
    createTimedZip(testFolder)
        .then(zipPath => {
            console.log(`\n✅ ZIP TEST PASSED!`);
            console.log(`   📍 Location: ${zipPath}`);
            
            // Check if ZIP exists
            if (fs.existsSync(zipPath)) {
                const stats = fs.statSync(zipPath);
                console.log(`   📦 File size: ${(stats.size / 1024).toFixed(2)} KB`);
            }
            
            // Clean up
            deleteFolder(testFolder);
        })
        .catch(err => {
            console.log(`\n❌ ZIP TEST FAILED: ${err.message}`);
        });
}