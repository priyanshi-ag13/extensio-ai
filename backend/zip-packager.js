// backend/zip-packager.js - UPDATED with auto-cleanup!
// Now automatically cleans up temp folders after zipping
// Day 3 - Commit 7: Added auto-cleanup system

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
    
    console.log(`   🗑️ Cleaning up: ${folderPath}/`);
    
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
        console.log(`   ✅ Cleanup complete!`);
    } catch (error) {
        console.log(`   ⚠️ Could not delete: ${error.message}`);
    }
}

/**
 * NEW: Create ZIP and automatically clean up source folder
 * @param {string} sourceFolder - Folder to zip (will be deleted after)
 * @returns {Promise<string>} - Path to created ZIP
 */
async function createZipAndCleanup(sourceFolder) {
    console.log(`\n🧹 Auto-cleanup mode enabled`);
    
    // Create the ZIP
    const zipPath = await createTimedZip(sourceFolder);
    
    // Automatically delete the source folder
    deleteFolder(sourceFolder);
    
    return zipPath;
}

/**
 * NEW: Clean up old ZIP files (keep only recent ones)
 * @param {number} keepCount - Number of recent ZIPs to keep (default: 10)
 */
function cleanupOldZips(keepCount = 10) {
    const downloadsDir = path.join(__dirname, '..', 'downloads');
    
    if (!fs.existsSync(downloadsDir)) {
        console.log(`📁 No downloads folder found`);
        return;
    }
    
    const files = fs.readdirSync(downloadsDir);
    const zipFiles = files.filter(f => f.endsWith('.zip'))
        .map(f => ({
            name: f,
            path: path.join(downloadsDir, f),
            mtime: fs.statSync(path.join(downloadsDir, f)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime); // Newest first
    
    if (zipFiles.length > keepCount) {
        const toDelete = zipFiles.slice(keepCount);
        console.log(`\n🧹 Cleaning up old ZIP files...`);
        console.log(`   Keeping ${keepCount} most recent, deleting ${toDelete.length} old ones`);
        
        for (const file of toDelete) {
            fs.unlinkSync(file.path);
            console.log(`   🗑️ Deleted: ${file.name}`);
        }
    }
}

module.exports = { 
    createZip, 
    createTimedZip, 
    deleteFolder,
    createZipAndCleanup,  // NEW!
    cleanupOldZips         // NEW!
};

// Test the module
if (require.main === module) {
    console.log("\n" + "🧪".repeat(10));
    console.log("TESTING ZIP PACKAGER WITH CLEANUP");
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
    
    // Test ZIP with auto-cleanup
    createZipAndCleanup(testFolder)
        .then(zipPath => {
            console.log(`\n✅ AUTO-CLEANUP TEST PASSED!`);
            console.log(`   📍 ZIP saved to: ${zipPath}`);
            
            // Verify folder is gone
            if (!fs.existsSync(testFolder)) {
                console.log(`   ✅ Temp folder was automatically deleted!`);
            }
            
            // Test old ZIP cleanup
            cleanupOldZips(5);
        })
        .catch(err => {
            console.log(`\n❌ TEST FAILED: ${err.message}`);
        });
}