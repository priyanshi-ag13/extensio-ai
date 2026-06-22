// backend/middleware/usageCheck.js
// Check if user has reached trial limit

const User = require('../models/User');

const checkUsageLimit = async (req, res, next) => {
    // Skip if no user ID (not logged in)
    if (!req.userId) {
        return next();
    }
    
    try {
        const user = await User.findById(req.userId);
        if (!user) return next();
        
        if (!user.canGenerate()) {
            return res.status(403).json({
                success: false,
                error: 'Free trial limit reached. Upgrade to premium!',
                limitReached: true,
                remaining: 0,
                redirectTo: '/pricing'
            });
        }
        
        // Attach user info to request
        req.user = user;
        next();
        
    } catch (error) {
        console.error('Usage check error:', error);
        next();
    }
};

module.exports = checkUsageLimit;