import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Classification from '../models/Classification.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ClassificationInput:
 *       type: object
 *       required:
 *         - cause
 *         - tier1_crisis_type
 *         - tier2_root_cause
 *         - geo
 *         - geoName
 *         - confidence
 *       properties:
 *         cause:
 *           type: string
 *           enum: [disaster_relief, health_crisis, climate_events, humanitarian_crisis, social_justice]
 *         tier1_crisis_type:
 *           type: string
 *           enum: [natural_disaster, health_emergency, conflict_displacement, climate_disaster, human_rights_violation, none]
 *         tier2_root_cause:
 *           type: string
 *           enum: [climate_driven, conflict_driven, poverty_driven, policy_driven, natural_phenomenon, systemic_inequality, multiple_factors, unknown]
 *         geo:
 *           type: string
 *         geoName:
 *           type: string
 *         confidence:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *         articleUrl:
 *           type: string
 *         articleTitle:
 *           type: string
 *         excerpt:
 *           type: string
 *         reasoning:
 *           type: string
 *         severityAssessment:
 *           type: object
 *           properties:
 *             level:
 *               type: string
 *               enum: [low, medium, high, critical]
 *             factors:
 *               type: array
 *               items:
 *                 type: string
 */

// Validation middleware
const validateClassification = [
  body('cause').isIn(['disaster_relief', 'health_crisis', 'climate_events', 'humanitarian_crisis', 'social_justice']).withMessage('Invalid cause'),
  body('tier1_crisis_type').isIn(['natural_disaster', 'health_emergency', 'conflict_displacement', 'climate_disaster', 'human_rights_violation', 'none']).withMessage('Invalid crisis type'),
  body('tier2_root_cause').isIn(['climate_driven', 'conflict_driven', 'poverty_driven', 'policy_driven', 'natural_phenomenon', 'systemic_inequality', 'multiple_factors', 'unknown']).withMessage('Invalid root cause'),
  body('geo').notEmpty().withMessage('Geographic location is required'),
  body('geoName').notEmpty().withMessage('Geographic name is required'),
  body('confidence').isFloat({ min: 0, max: 1 }).withMessage('Confidence must be between 0 and 1'),
];

/**
 * @swagger
 * /api/v1/classifications:
 *   post:
 *     summary: Create a new classification
 *     tags: [Classifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassificationInput'
 *     responses:
 *       201:
 *         description: Classification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 classification:
 *                   $ref: '#/components/schemas/Classification'
 *       200:
 *         description: Classification already exists for this article
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 classification:
 *                   $ref: '#/components/schemas/Classification'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validateClassification, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const classificationData = req.body;

    // Check if classification already exists for this article URL
    if (classificationData.articleUrl) {
      const existing = await Classification.findOne({ articleUrl: classificationData.articleUrl });
      if (existing) {
        res.json({
          success: true,
          classification: existing,
          message: 'Classification already exists for this article',
        });
        return;
      }
    }

    const classification = new Classification(classificationData);
    await classification.save();

    res.status(201).json({
      success: true,
      classification,
    });
  } catch (error) {
    console.error('Error creating classification:', error);
    res.status(500).json({ error: 'Failed to create classification' });
  }
});

/**
 * @swagger
 * /api/v1/classifications:
 *   get:
 *     summary: Get classifications with optional filters
 *     tags: [Classifications]
 *     parameters:
 *       - in: query
 *         name: cause
 *         schema:
 *           type: string
 *           enum: [disaster_relief, health_crisis, climate_events, humanitarian_crisis, social_justice]
 *         description: Filter by cause
 *       - in: query
 *         name: geo
 *         schema:
 *           type: string
 *         description: Filter by geographic location
 *       - in: query
 *         name: articleUrl
 *         schema:
 *           type: string
 *         description: Filter by article URL
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of classifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Classification'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      cause,
      geo,
      articleUrl,
      limit = '50',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter: any = {};
    
    if (cause) filter.cause = cause;
    if (geo) filter.geo = geo;
    if (articleUrl) filter.articleUrl = articleUrl;

    const classifications = await Classification.find(filter)
      .sort({ [sortBy as string]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .lean();

    const total = await Classification.countDocuments(filter);

    res.json({
      classifications,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + classifications.length,
      },
    });
  } catch (error) {
    console.error('Error fetching classifications:', error);
    res.status(500).json({ error: 'Failed to fetch classifications' });
  }
});

/**
 * @swagger
 * /api/v1/classifications/by-article:
 *   get:
 *     summary: Get classification by article URL
 *     tags: [Classifications]
 *     parameters:
 *       - in: query
 *         name: articleUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: Article URL to search for
 *     responses:
 *       200:
 *         description: Classification found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classification:
 *                   $ref: '#/components/schemas/Classification'
 *       400:
 *         description: Missing articleUrl parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Classification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/by-article', async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleUrl } = req.query;

    if (!articleUrl) {
      res.status(400).json({ error: 'articleUrl is required' });
      return;
    }

    const classification = await Classification.findOne({ articleUrl: articleUrl as string });

    if (!classification) {
      res.status(404).json({ error: 'Classification not found' });
      return;
    }

    res.json({ classification });
  } catch (error) {
    console.error('Error fetching classification:', error);
    res.status(500).json({ error: 'Failed to fetch classification' });
  }
});

/**
 * @swagger
 * /api/v1/classifications/stats:
 *   get:
 *     summary: Get classification statistics
 *     tags: [Classifications]
 *     responses:
 *       200:
 *         description: Classification statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of classifications
 *                 byCause:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       avgConfidence:
 *                         type: number
 *                 byGeo:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       geoName:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 bySeverity:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: integer
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const byCause = await Classification.aggregate([
      {
        $group: {
          _id: '$cause',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const byGeo = await Classification.aggregate([
      {
        $group: {
          _id: '$geo',
          geoName: { $first: '$geoName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    const bySeverity = await Classification.aggregate([
      {
        $group: {
          _id: '$severityAssessment.level',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const total = await Classification.countDocuments();

    res.json({
      total,
      byCause,
      byGeo,
      bySeverity,
    });
  } catch (error) {
    console.error('Error fetching classification stats:', error);
    res.status(500).json({ error: 'Failed to fetch classification statistics' });
  }
});

export default router;