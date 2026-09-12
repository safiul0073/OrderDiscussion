import express, { Request, Response } from 'express';
import { getUserOrders } from './controllers/orders';
import { requireAuth, authorizeUserOrAdmin } from './middleware/auth';
import apiLimiter from './middleware/rateLimiter';

const app = express();
app.use(express.json());

// Apply rate limiting to all /api routes
app.use('/api/', apiLimiter);

// Endpoint: GET /api/users/:id/orders
app.get('/api/users/:id/orders', requireAuth, authorizeUserOrAdmin, getUserOrders);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

export default app;
