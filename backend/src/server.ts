import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { swaggerSpec } from './config/swagger.js';
import donationsRouter from './routes/donations.js';
import usersRouter from './routes/users.js';
import classificationsRouter from './routes/classifications.js';
import chatRouter from './routes/chat.js';
import organizationsRouter from './routes/organizations.js';
import newsRouter from './routes/news.js';
import recommendationsRouter from './routes/recommendations.js';
import analyticsRouter from './routes/analytics.js';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.API_VERSION || 'v1';

// Security middleware
app.use(helmet());

// CORS configuration - allow multiple frontend origins for development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5140',
  'http://localhost:5137',
  'http://localhost:5138',
  'http://localhost:5139',
  'http://localhost:5141',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(`/api/${API_VERSION}`, apiLimiter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FeelGive API Documentation',
}));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: development
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use(`/api/${API_VERSION}/donations`, donationsRouter);
app.use(`/api/${API_VERSION}/users`, usersRouter);
app.use(`/api/${API_VERSION}/classifications`, classificationsRouter);
app.use(`/api/${API_VERSION}/chat`, chatRouter);
app.use(`/api/${API_VERSION}/organizations`, organizationsRouter);
app.use(`/api/${API_VERSION}/news`, newsRouter);
app.use(`/api/${API_VERSION}/recommendations`, recommendationsRouter);
app.use(`/api/${API_VERSION}/analytics`, analyticsRouter);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: string
 *                     documentation:
 *                       type: string
 *                     donations:
 *                       type: string
 *                     users:
 *                       type: string
 *                     classifications:
 *                       type: string
 *                     chat:
 *                       type: string
 *                     organizations:
 *                       type: string
 */
app.get('/', (_req, res) => {
  res.json({
    message: 'FeelGive API',
    version: API_VERSION,
    endpoints: {
      health: '/health',
      documentation: '/api-docs',
      donations: `/api/${API_VERSION}/donations`,
      users: `/api/${API_VERSION}/users`,
      classifications: `/api/${API_VERSION}/classifications`,
      chat: `/api/${API_VERSION}/chat`,
      organizations: `/api/${API_VERSION}/organizations`,
      news: `/api/${API_VERSION}/news`,
      recommendations: `/api/${API_VERSION}/recommendations`,
      analytics: `/api/${API_VERSION}/analytics`,
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();