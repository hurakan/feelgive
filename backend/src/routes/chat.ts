import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { geminiService } from '../services/gemini.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { responseCacheService } from '../services/response-cache.js';

const router = express.Router();

// Apply rate limiting to all chat routes
router.use(chatLimiter);

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           enum: [user, model]
 *         content:
 *           type: string
 *     ArticleClassification:
 *       type: object
 *       properties:
 *         cause:
 *           type: string
 *         geoName:
 *           type: string
 *         severity:
 *           type: string
 *         identified_needs:
 *           type: array
 *           items:
 *             type: string
 *         affectedGroups:
 *           type: array
 *           items:
 *             type: string
 *     MatchedCharity:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         trustScore:
 *           type: number
 *     ArticleContext:
 *       type: object
 *       required:
 *         - articleTitle
 *         - articleText
 *         - articleSummary
 *         - classification
 *         - matchedCharities
 *       properties:
 *         articleTitle:
 *           type: string
 *         articleText:
 *           type: string
 *         articleSummary:
 *           type: string
 *         classification:
 *           $ref: '#/components/schemas/ArticleClassification'
 *         matchedCharities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchedCharity'
 *     ChatRequest:
 *       type: object
 *       required:
 *         - message
 *         - context
 *       properties:
 *         message:
 *           type: string
 *           description: The user's question
 *         context:
 *           $ref: '#/components/schemas/ArticleContext'
 *         history:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChatMessage'
 *           description: Previous conversation messages
 *         enableWebSearch:
 *           type: boolean
 *           description: Whether to enhance response with web search results
 *           default: false
 *     ChatResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: The AI's markdown-formatted response
 *         suggestions:
 *           type: array
 *           items:
 *             type: string
 *           description: 2-3 short follow-up questions
 *         sources:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               url:
 *                 type: string
 *           description: Sources used to answer the question
 */

// Validation middleware
const validateChatRequest = [
  body('message')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('context')
    .isObject()
    .withMessage('Context is required'),
  body('context.articleTitle')
    .isString()
    .notEmpty()
    .withMessage('Article title is required'),
  body('context.articleText')
    .isString()
    .notEmpty()
    .withMessage('Article text is required'),
  body('context.articleSummary')
    .isString()
    .notEmpty()
    .withMessage('Article summary is required'),
  body('context.articleUrl')
    .optional()
    .isString()
    .withMessage('Article URL must be a string'),
  body('context.classification')
    .isObject()
    .withMessage('Classification is required'),
  body('context.classification.cause')
    .isString()
    .notEmpty()
    .withMessage('Classification cause is required'),
  body('context.classification.geoName')
    .isString()
    .notEmpty()
    .withMessage('Geographic name is required'),
  body('context.classification.severity')
    .isString()
    .notEmpty()
    .withMessage('Severity is required'),
  body('context.matchedCharities')
    .isArray()
    .withMessage('Matched charities must be an array'),
  body('history')
    .optional()
    .isArray()
    .withMessage('History must be an array'),
  body('enableWebSearch')
    .optional()
    .isBoolean()
    .withMessage('enableWebSearch must be a boolean'),
];

/**
 * @swagger
 * /api/v1/chat/message:
 *   post:
 *     summary: Send a message to the AI assistant about a crisis article
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/message', validateChatRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        error: 'Validation failed',
        errors: errors.array() 
      });
      return;
    }

    const { message, context, history = [], enableWebSearch = false } = req.body;

    // Truncate article text if excessively long (prevent abuse)
    const MAX_ARTICLE_LENGTH = 50000; // ~50k characters
    if (context.articleText.length > MAX_ARTICLE_LENGTH) {
      context.articleText = context.articleText.substring(0, MAX_ARTICLE_LENGTH) + '... [truncated]';
    }

    // Limit history to last 10 messages to prevent token overflow
    const limitedHistory = history.slice(-10);

    // Generate response using Gemini service
    const aiResponse = await geminiService.generateResponse({
      message,
      context,
      history: limitedHistory,
      enableWebSearch,
    });

    // Generate follow-up suggestions
    const suggestions = geminiService.generateSuggestions(context);

    res.json({
      message: aiResponse.message,
      suggestions,
      sources: aiResponse.sources,
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API configuration error')) {
        res.status(500).json({ 
          error: 'Service configuration error. Please contact support.' 
        });
        return;
      }
      
      if (error.message.includes('temporarily unavailable')) {
        res.status(503).json({ 
          error: error.message 
        });
        return;
      }
      
      // Return the graceful fallback message
      res.status(500).json({ 
        error: error.message 
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to generate response. Please try again.' 
    });
  }
});

/**
 * @swagger
 * /api/v1/chat/health:
 *   get:
 *     summary: Check if the chat service is available
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Chat service is available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: gemini
 *       500:
 *         description: Chat service is unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 error:
 *                   type: string
 */
router.get('/health', (_req: Request, res: Response): void => {
  try {
    // Check if API key is configured
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      res.status(500).json({
        status: 'error',
        error: 'API key not configured',
      });
      return;
    }

    res.json({
      status: 'ok',
      service: 'gemini',
      model: process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash',
    });
  } catch (error) {
    console.error('Error checking chat service health:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to check service health',
    });
  }
});

/**
 * @swagger
 * /api/v1/chat/cache/stats:
 *   get:
 *     summary: Get response cache statistics
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalEntries:
 *                       type: number
 *                     totalHits:
 *                       type: number
 *                     totalMisses:
 *                       type: number
 *                     hitRate:
 *                       type: number
 *                     oldestEntry:
 *                       type: number
 *                       nullable: true
 *                     newestEntry:
 *                       type: number
 *                       nullable: true
 */
router.get('/cache/stats', (_req: Request, res: Response): void => {
  try {
    const stats = responseCacheService.getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve cache statistics',
    });
  }
});

/**
 * @swagger
 * /api/v1/chat/cache/debug:
 *   get:
 *     summary: Get detailed cache debug information (development only)
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Cache debug info retrieved successfully
 *       403:
 *         description: Only available in development mode
 */
router.get('/cache/debug', (_req: Request, res: Response): void => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        error: 'Debug endpoint only available in development mode',
      });
      return;
    }

    const debugInfo = responseCacheService.getDebugInfo();
    res.json(debugInfo);
  } catch (error) {
    console.error('Error getting cache debug info:', error);
    res.status(500).json({
      error: 'Failed to retrieve cache debug information',
    });
  }
});

/**
 * @swagger
 * /api/v1/chat/cache/clear:
 *   post:
 *     summary: Clear the response cache (development only)
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       403:
 *         description: Only available in development mode
 */
router.post('/cache/clear', (_req: Request, res: Response): void => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        error: 'Cache clear only available in development mode',
      });
      return;
    }

    responseCacheService.clear();
    res.json({
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
    });
  }
});

export default router;