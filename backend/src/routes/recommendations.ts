import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { recommendationOrchestrator } from '../services/recommendations/orchestrator.js';
import { ArticleContext } from '../services/recommendations/orchestrator.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/recommendations:
 *   post:
 *     summary: Get nonprofit recommendations for an article
 *     tags: [Recommendations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - entities
 *               - causes
 *             properties:
 *               title:
 *                 type: string
 *                 description: Article title
 *               description:
 *                 type: string
 *                 description: Article description
 *               content:
 *                 type: string
 *                 description: Article content
 *               url:
 *                 type: string
 *                 description: Article URL
 *               entities:
 *                 type: object
 *                 properties:
 *                   geography:
 *                     type: object
 *                     properties:
 *                       country:
 *                         type: string
 *                       region:
 *                         type: string
 *                       city:
 *                         type: string
 *                   disasterType:
 *                     type: string
 *                   affectedGroup:
 *                     type: string
 *               causes:
 *                 type: array
 *                 items:
 *                   type: string
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               debug:
 *                 type: boolean
 *                 description: Enable debug mode
 *               topN:
 *                 type: number
 *                 description: Number of top results to return
 *     responses:
 *       200:
 *         description: Nonprofit recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 nonprofits:
 *                   type: array
 *                   items:
 *                     type: object
 *                 debug:
 *                   type: object
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  [
    body('title').isString().trim().notEmpty().withMessage('Title is required'),
    body('description').optional().isString().trim(),
    body('content').optional().isString().trim(),
    body('url').optional().isString().trim(),
    body('entities').isObject().withMessage('Entities object is required'),
    body('entities.geography').isObject().withMessage('Geography is required'),
    body('causes').isArray().withMessage('Causes array is required'),
    body('keywords').optional().isArray(),
    body('debug').optional().isBoolean(),
    body('topN').optional().isInt({ min: 1, max: 50 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ 
          success: false,
          error: 'Validation error', 
          errors: errors.array() 
        });
        return;
      }

      const {
        title,
        description,
        content,
        url,
        entities,
        causes,
        keywords = [],
        debug = false,
        topN = 10,
      } = req.body;

      // Build article context
      const context: ArticleContext = {
        title,
        description,
        content,
        url,
        entities,
        causes,
        keywords,
      };

      // Get recommendations
      const result = await recommendationOrchestrator.recommendNonprofitsForArticle(
        context,
        { debug, topN }
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      res.status(500).json({
        success: false,
        error: 'Failed to get recommendations',
        message: errorMessage,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/recommendations/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: Cache statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 */
router.get('/cache/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = recommendationOrchestrator.getCacheStats();
    
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats',
    });
  }
});

/**
 * @swagger
 * /api/v1/recommendations/cache/clear:
 *   post:
 *     summary: Clear recommendation cache
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: Cache cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/cache/clear', async (req: Request, res: Response): Promise<void> => {
  try {
    recommendationOrchestrator.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
    });
  }
});

export default router;