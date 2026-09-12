import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * Mock Authentication Middleware
 * In a real application, this would verify a JWT. 
 * We simulate authentication via 'x-user-id' and 'x-user-role' headers.
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const userId = req.headers['x-user-id'];
  const role = req.headers['x-user-role'];

  if (!userId || typeof userId !== 'string') {
    res.status(401).json({ error: 'Unauthorized: Missing x-user-id header' });
    return;
  }

  const parsedId = parseInt(userId, 10);
  if (isNaN(parsedId)) {
    res.status(400).json({ error: 'Invalid x-user-id header format' });
    return;
  }

  req.user = {
    id: parsedId,
    role: typeof role === 'string' ? role : 'user',
  };

  next();
};

/**
 * Authorization Middleware
 * Requirement: "Only the user them self, or an admin, may view a user's orders"
 */
export const authorizeUserOrAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const targetUserId = parseInt(rawId, 10);

  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Authentication required' });
    return;
  }

  if (req.user.role === 'admin') {
    next();
    return;
  }

  if (req.user.id !== targetUserId) {
    res.status(403).json({ error: "Forbidden: You can only view your own orders" });
    return;
  }

  next();
};
