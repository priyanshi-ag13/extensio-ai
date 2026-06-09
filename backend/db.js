// backend/db.js
// MongoDB connection setup
// Day 5 - Commit 11: Database connection

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not found in .env file!');
    console.log('📝 Please add: MONGODB_URI=your_mongodb_connection_string');
    process.exit(1);
}

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB connected successfully!');
        console.log(`📁 Database: ${mongoose.connection.name}`);
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        return false;
    }
}

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('🔌 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.log('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed on app termination');
    process.exit(0);
});

module.exports = connectDB;