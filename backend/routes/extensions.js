// backend/routes/extensions.js
// Routes for saving, loading, and managing extensions with version history
// Day 7 - Commit 18: Version history support

const express = require('express');
const jwt = require('jsonwebtoken');
const Extension = require('../models/Extension');
const router = express.Router();

// Middleware to verify user is logged in
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Not authenticated. Please login.' 
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
        
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid or expired token' 
        });
    }
};

// SAVE EXTENSION - Save a generated extension to user's account
router.post('/save', authMiddleware, async (req, res) => {
    console.log('\n💾 Saving extension for user:', req.userId);
    
    try {
        const { prompt, name, files, downloadUrl } = req.body;
        
        // Validation
        if (!prompt || !files || !downloadUrl) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: prompt, files, downloadUrl' 
            });
        }
        
        // Create extension record - WITHOUT using pre-save middleware
        const extension = new Extension({
            user: req.userId,
            prompt: prompt,
            name: name || prompt.substring(0, 40),
            files: files,
            downloadUrl: downloadUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
            versionHistory: []
        });
        
        // Save directly
        await extension.save();
        
        console.log('✅ Extension saved! ID:', extension._id);
        
        res.status(201).json({
            success: true,
            message: 'Extension saved successfully!',
            extension: extension.getPublicInfo()
        });
        
    } catch (error) {
        console.error('❌ Save extension error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});
// GET ALL EXTENSIONS
router.get('/my-extensions', authMiddleware, async (req, res) => {
    console.log('\n📋 Fetching extensions for user:', req.userId);
    
    try {
        const extensions = await Extension.find({ user: req.userId })
            .sort({ createdAt: -1 });
        
        console.log(`✅ Found ${extensions.length} extensions`);
        
        res.json({
            success: true,
            count: extensions.length,
            extensions: extensions.map(ext => ext.getPublicInfo())
        });
        
    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// GET SINGLE EXTENSION with version history
router.get('/:id', authMiddleware, async (req, res) => {
    console.log('\n📄 Fetching extension:', req.params.id);
    
    try {
        const extension = await Extension.findOne({ 
            _id: req.params.id, 
            user: req.userId 
        });
        
        if (!extension) {
            return res.status(404).json({ 
                success: false, 
                error: 'Extension not found' 
            });
        }
        
        res.json({
            success: true,
            extension: {
                ...extension.getPublicInfo(),
                files: extension.files,
                versionHistory: extension.getVersionHistory()
            }
        });
        
    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// UPDATE EXTENSION - Add new version to history
router.put('/:id', authMiddleware, async (req, res) => {
    console.log('\n✏️ Updating extension:', req.params.id);
    
    try {
        const { files, downloadUrl, name } = req.body;
        
        const extension = await Extension.findOne({ 
            _id: req.params.id, 
            user: req.userId 
        });
        
        if (!extension) {
            return res.status(404).json({ 
                success: false, 
                error: 'Extension not found' 
            });
        }
        
        // Save current version to history
        await extension.addVersionToHistory(files, downloadUrl);
        
        // Update fields
        if (name) extension.name = name;
        extension.updatedAt = new Date();
        
        await extension.save();
        
        console.log('✅ Extension updated! New version:', extension.version);
        
        res.json({
            success: true,
            message: 'Extension updated successfully!',
            extension: extension.getPublicInfo()
        });
        
    } catch (error) {
        console.error('❌ Update error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// RESTORE SPECIFIC VERSION
router.post('/:id/restore/:version', authMiddleware, async (req, res) => {
    console.log(`\n🔄 Restoring version ${req.params.version} of extension:`, req.params.id);
    
    try {
        const extension = await Extension.findOne({ 
            _id: req.params.id, 
            user: req.userId 
        });
        
        if (!extension) {
            return res.status(404).json({ 
                success: false, 
                error: 'Extension not found' 
            });
        }
        
        const targetVersion = parseInt(req.params.version);
        const versionData = extension.versionHistory.find(v => v.version === targetVersion);
        
        if (!versionData) {
            return res.status(404).json({ 
                success: false, 
                error: 'Version not found' 
            });
        }
        
        // Save current version to history before restoring
        await extension.addVersionToHistory(extension.files, extension.downloadUrl);
        
        // Restore old version
        extension.files = versionData.files;
        extension.downloadUrl = versionData.downloadUrl;
        extension.version += 1;
        extension.updatedAt = Date.now();
        
        await extension.save();
        
        console.log('✅ Restored to version', targetVersion, '- New version:', extension.version);
        
        res.json({
            success: true,
            message: `Restored to version ${targetVersion}!`,
            extension: extension.getPublicInfo()
        });
        
    } catch (error) {
        console.error('❌ Restore error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// GET VERSION HISTORY
router.get('/:id/history', authMiddleware, async (req, res) => {
    console.log('\n📜 Fetching version history for:', req.params.id);
    
    try {
        const extension = await Extension.findOne({ 
            _id: req.params.id, 
            user: req.userId 
        });
        
        if (!extension) {
            return res.status(404).json({ 
                success: false, 
                error: 'Extension not found' 
            });
        }
        
        res.json({
            success: true,
            currentVersion: extension.version,
            history: extension.getVersionHistory()
        });
        
    } catch (error) {
        console.error('❌ History error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// DELETE EXTENSION
router.delete('/:id', authMiddleware, async (req, res) => {
    console.log('\n🗑️ Deleting extension:', req.params.id);
    
    try {
        const extension = await Extension.findOneAndDelete({ 
            _id: req.params.id, 
            user: req.userId 
        });
        
        if (!extension) {
            return res.status(404).json({ 
                success: false, 
                error: 'Extension not found' 
            });
        }
        
        console.log('✅ Extension deleted');
        
        res.json({
            success: true,
            message: 'Extension deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Delete error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;