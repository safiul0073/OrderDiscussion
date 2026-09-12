const express = require('express');
const { getUserOrders } = require('./controllers/orders');
const { requireAuth, authorizeUserOrAdmin } = require('./middleware/auth');
const apiLimiter = require('./middleware/rateLimiter');

const app = express();
app.use(express.json());

// Apply rate limiting to all /api routes
app.use('/api/', apiLimiter);

// Endpoint: GET /api/users/:id/orders
app.get('/api/users/:id/orders', requireAuth, authorizeUserOrAdmin, getUserOrders);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;
