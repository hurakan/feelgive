import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for donation endpoints
export const donationLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10,
  message: 'Too many donation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for classification endpoints
export const classificationLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 20,
  message: 'Too many classification requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for chat endpoints (stricter to prevent API cost spikes)
export const chatLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10,
  message: 'Too many chat requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});