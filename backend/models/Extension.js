// backend/models/Extension.js
// Extension model - FIXED VERSION (No middleware issues)
// Day 9 - Commit 27: Fixed save extension error

const mongoose = require('mongoose');

const extensionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    prompt: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        default: function() {
            return this.prompt.substring(0, 40) + '...';
        }
    },
    files: {
        type: Object,
        required: true
    },
    downloadUrl: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    version: {
        type: Number,
        default: 1
    },
    versionHistory: {
        type: Array,
        default: []
    }
});

// FIXED: Remove the problematic pre-save middleware
// Instead, we'll handle updatedAt manually in routes

// Method to get public info
extensionSchema.methods.getPublicInfo = function() {
    return {
        id: this._id,
        name: this.name,
        prompt: this.prompt,
        downloadUrl: this.downloadUrl,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        version: this.version,
        hasHistory: this.versionHistory && this.versionHistory.length > 0
    };
};

// Method to get version history
extensionSchema.methods.getVersionHistory = function() {
    if (!this.versionHistory) return [];
    return this.versionHistory.map(v => ({
        version: v.version,
        downloadUrl: v.downloadUrl,
        createdAt: v.createdAt
    }));
};

// Method to add version to history
extensionSchema.methods.addVersionToHistory = async function(files, downloadUrl) {
    if (!this.versionHistory) {
        this.versionHistory = [];
    }
    
    this.versionHistory.push({
        version: this.version,
        files: this.files,
        downloadUrl: this.downloadUrl,
        createdAt: this.updatedAt || new Date()
    });
    
    // Keep only last 10 versions
    if (this.versionHistory.length > 10) {
        this.versionHistory.shift();
    }
    
    // Update to new version
    this.files = files || this.files;
    this.downloadUrl = downloadUrl || this.downloadUrl;
    this.version += 1;
    this.updatedAt = new Date();
    
    await this.save();
};

module.exports = mongoose.model('Extension', extensionSchema);