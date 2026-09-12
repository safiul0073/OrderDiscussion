import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter to protect the API from abuse/DDoS.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    error: 'Too many requests, please try again later.',
  },
});

export default apiLimiter;
