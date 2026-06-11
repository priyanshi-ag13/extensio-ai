// backend/models/Extension.js
// Extension model - with version history tracking
// Day 7 - Commit 18: Version history support

const mongoose = require('mongoose');

const versionHistorySchema = new mongoose.Schema({
    version: {
        type: Number,
        required: true
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
    }
});

const extensionSchema = new mongoose.Schema({
    // Which user owns this extension
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // The user's original prompt/description
    prompt: {
        type: String,
        required: true,
        trim: true
    },
    
    // Name of the extension (auto-generated or user-provided)
    name: {
        type: String,
        required: true,
        trim: true,
        default: function() {
            return this.prompt.substring(0, 40) + '...';
        }
    },
    
    // The generated code files (current version)
    files: {
        type: Object,
        required: true
    },
    
    // Download URL for the current ZIP file
    downloadUrl: {
        type: String,
        required: true
    },
    
    // Version history
    versionHistory: [versionHistorySchema],
    
    // Current version number
    version: {
        type: Number,
        default: 1
    },
    
    // When it was created
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    // When it was last updated
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
extensionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to add new version to history
extensionSchema.methods.addVersionToHistory = async function(files, downloadUrl) {
    this.versionHistory.push({
        version: this.version,
        files: this.files,
        downloadUrl: this.downloadUrl,
        createdAt: this.updatedAt
    });
    
    // Limit history to last 10 versions
    if (this.versionHistory.length > 10) {
        this.versionHistory.shift();
    }
    
    await this.save();
};

// Method to get public info (without sensitive data)
extensionSchema.methods.getPublicInfo = function() {
    return {
        id: this._id,
        name: this.name,
        prompt: this.prompt,
        downloadUrl: this.downloadUrl,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        version: this.version,
        hasHistory: this.versionHistory.length > 0
    };
};

// Method to get full version history
extensionSchema.methods.getVersionHistory = function() {
    return this.versionHistory.map(v => ({
        version: v.version,
        downloadUrl: v.downloadUrl,
        createdAt: v.createdAt
    }));
};

module.exports = mongoose.model('Extension', extensionSchema);