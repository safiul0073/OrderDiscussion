/**
 * Mock Authentication Middleware
 * In a real application, this would verify a JWT. 
 * We simulate authentication via 'x-user-id' and 'x-user-role' headers.
 */
const requireAuth = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role']; // 'user' or 'admin'

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Missing x-user-id header' });
    }

    req.user = {
        id: parseInt(userId, 10),
        role: role || 'user'
    };

    next();
};

/**
 * Authorization Middleware
 * Requirement: "Only the user themself, or an admin, may view a user's orders"
 */
const authorizeUserOrAdmin = (req, res, next) => {
    const targetUserId = parseInt(req.params.id, 10);

    if (req.user.role === 'admin') {
        return next();
    }

    if (req.user.id !== targetUserId) {
        return res.status(403).json({ error: 'Forbidden: You can only view your own orders' });
    }

    next();
};

module.exports = { requireAuth, authorizeUserOrAdmin };
