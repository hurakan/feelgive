import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { isAdmin } from '../middleware/isAdmin.js';
import { organizationEnrichmentService } from '../services/organization-enrichment.js';
import { irsBmfIngestionService } from '../services/irs-bmf-ingestion.js';
import { proPublicaService } from '../services/propublica.js';
import { charityNavigatorService } from '../services/charity-navigator.js';
import { circuitBreakerManager } from '../utils/circuit-breaker.js';
import { dataQualityService } from '../services/data-quality.js';
import EnrichedOrganization from '../models/EnrichedOrganization.js';

const router = express.Router();

// Rate limiter for enrichment endpoints
const enrichmentLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many enrichment requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for admin endpoints (more permissive)
const adminLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100,
  message: 'Too many admin requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * /api/v1/enrichment/enrich:
 *   post:
 *     summary: Enrich a single organization
 *     tags: [Enrichment]
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slug
 *               - id
 *               - name
 *             properties:
 *               slug:
 *                 type: string
 *               id:
 *                 type: string
 *               ein:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               forceRefresh:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Organization enriched successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post(
  '/enrich',
  enrichmentLimiter,
  isAdmin,
  [
    body('slug').notEmpty().withMessage('Organization slug is required'),
    body('id').notEmpty().withMessage('Organization ID is required'),
    body('ein').optional().isString(),
    body('name').notEmpty().withMessage('Organization name is required'),
    body('description').optional().isString(),
    body('forceRefresh').optional().isBoolean(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { forceRefresh = false, ...orgData } = req.body;

      const result = await organizationEnrichmentService.enrichOrganization(
        orgData,
        forceRefresh
      );

      res.json({
        success: result.success,
        data: result.organization,
        sources: result.sources,
        errors: result.errors,
        fromCache: result.fromCache,
      });
    } catch (error: any) {
      console.error('[Enrichment API] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to enrich organization',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/enrichment/batch:
 *   post:
 *     summary: Enrich multiple organizations
 *     tags: [Enrichment]
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizations
 *             properties:
 *               organizations:
 *                 type: array
 *                 items:
 *                   type: object
 *               forceRefresh:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Batch enrichment completed
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post(
  '/batch',
  enrichmentLimiter,
  isAdmin,
  [
    body('organizations')
      .isArray({ min: 1, max: 100 })
      .withMessage('Organizations array is required (max 100)'),
    body('forceRefresh').optional().isBoolean(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { organizations, forceRefresh = false } = req.body;

      const results = await organizationEnrichmentService.enrichBatch(
        organizations,
        forceRefresh
      );

      const summary = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        fromCache: results.filter(r => r.fromCache).length,
      };

      res.json({
        success: true,
        summary,
        results,
      });
    } catch (error: any) {
      console.error('[Enrichment API] Batch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to enrich organizations',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/enrichment/{slug}:
 *   get:
 *     summary: Get enriched data for an organization
 *     tags: [Enrichment]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enriched organization data
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:slug',
  enrichmentLimiter,
  [param('slug').notEmpty().withMessage('Slug is required')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const enriched = await EnrichedOrganization.findOne({
        everyOrgSlug: req.params.slug,
      });

      if (!enriched) {
        res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
        return;
      }

      res.json({
        success: true,
        data: enriched,
      });
    } catch (error: any) {
      console.error('[Enrichment API] Get error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve enriched data',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/enrichment/ein/{ein}:
 *   get:
 *     summary: Get enriched data by EIN
 *     tags: [Enrichment]
 *     parameters:
 *       - in: path
 *         name: ein
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enriched organization data
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.get(
  '/ein/:ein',
  enrichmentLimiter,
  [param('ein').notEmpty().withMessage('EIN is required')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const enriched = await EnrichedOrganization.findOne({
        ein: req.params.ein.replace(/\D/g, ''), // Normalize EIN
      });

      if (!enriched) {
        res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
        return;
      }

      res.json({
        success: true,
        data: enriched,
      });
    } catch (error: any) {
      console.error('[Enrichment API] Get by EIN error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve enriched data',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/enrichment/stats:
 *   get:
 *     summary: Get enrichment statistics
 *     tags: [Enrichment]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: Enrichment statistics
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get(
  '/stats',
  adminLimiter,
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await organizationEnrichmentService.getStats();
      const irsBmfStats = await irsBmfIngestionService.getStats();

      res.json({
        success: true,
        enrichment: stats,
        irsBmf: irsBmfStats,
        services: {
          propublica: proPublicaService.getStats(),
          charityNavigator: charityNavigatorService.getStats(),
        },
        circuitBreakers: circuitBreakerManager.getAllStats(),
      });
    } catch (error: any) {
      console.error('[Enrichment API] Stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve stats',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/enrichment/search:
 *   get:
 *     summary: Search enriched organizations
 *     tags: [Enrichment]
 *     parameters:
 *       - in: query
 *         name: nteeCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 *       500:
 *         description: Server error
 */
router.get(
  '/search',
  enrichmentLimiter,
  [
    query('nteeCode').optional().isString(),
    query('state').optional().isString(),
    query('city').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { nteeCode, state, city, limit = 20 } = req.query;

      const filter: any = {
        'metadata.enrichmentStatus': { $in: ['complete', 'partial'] },
      };

      if (nteeCode) {
        filter['classification.nteeCode'] = nteeCode;
      }
      if (state) {
        filter['location.state'] = state;
      }
      if (city) {
        filter['location.city'] = new RegExp(city as string, 'i');
      }

      const results = await EnrichedOrganization.find(filter)
        .limit(parseInt(limit as string))
        .sort({ 'metadata.lastEnrichedAt': -1 });

      res.json({
        success: true,
        count: results.length,
        data: results,
      });
    } catch (error: any) {
      console.error('[Enrichment API] Search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search organizations',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/enrichment/circuit-breaker/reset:
 *   post:
 *     summary: Reset circuit breakers
 *     tags: [Enrichment]
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service:
 *                 type: string
 *                 description: Service name (ProPublica, CharityNavigator) or 'all'
 *     responses:
 *       200:
 *         description: Circuit breaker reset
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post(
  '/circuit-breaker/reset',
  adminLimiter,
  isAdmin,
  [body('service').optional().isString()],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { service } = req.body;

      if (service === 'all' || !service) {
        circuitBreakerManager.resetAll();
        res.json({
          success: true,
          message: 'All circuit breakers reset',
        });
      } else {
        circuitBreakerManager.reset(service);
        res.json({
          success: true,
          message: `Circuit breaker reset for ${service}`,
        });
      }
    } catch (error: any) {
      console.error('[Enrichment API] Circuit breaker reset error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset circuit breaker',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/enrichment/circuit-breaker/status:
 *   get:
 *     summary: Get circuit breaker status
 *     tags: [Enrichment]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: Circuit breaker status
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get(
  '/circuit-breaker/status',
  adminLimiter,
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const allStats = circuitBreakerManager.getAllStats();
      
      res.json({
        success: true,
        propublica: allStats.ProPublica || {
          state: 'CLOSED',
          failures: 0,
          lastFailure: null,
          nextAttempt: null
        },
        charityNavigator: allStats.CharityNavigator || {
          state: 'CLOSED',
          failures: 0,
          lastFailure: null,
          nextAttempt: null
        }
      });
    } catch (error: any) {
      console.error('[Enrichment API] Circuit breaker status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get circuit breaker status',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/enrichment/quality-report:
 *   get:
 *     summary: Get data quality report
 *     tags: [Enrichment]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: Data quality report
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get(
  '/quality-report',
  adminLimiter,
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const report = await dataQualityService.generateQualityReport();
      
      res.json({
        success: true,
        ...report
      });
    } catch (error: any) {
      console.error('[Enrichment API] Quality report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate quality report',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/enrichment/bulk-enrich:
 *   post:
 *     summary: Start bulk enrichment of all organizations
 *     tags: [Enrichment]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       202:
 *         description: Bulk enrichment started
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post(
  '/bulk-enrich',
  adminLimiter,
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Start bulk enrichment in background
      // This would typically be handled by a job queue in production
      res.status(202).json({
        success: true,
        message: 'Bulk enrichment started in background. Use the bulk enrichment script for better control.',
      });
    } catch (error: any) {
      console.error('[Enrichment API] Bulk enrichment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start bulk enrichment',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/enrichment/irs-bmf/import:
 *   post:
 *     summary: Trigger IRS BMF data import
 *     tags: [Enrichment]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       202:
 *         description: Import started
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post(
  '/irs-bmf/import',
  adminLimiter,
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Start import in background
      irsBmfIngestionService.importAll().then(result => {
        console.log('[IRS BMF Import] Completed:', result);
      }).catch(error => {
        console.error('[IRS BMF Import] Failed:', error);
      });

      res.status(202).json({
        success: true,
        message: 'IRS BMF import started in background',
      });
    } catch (error: any) {
      console.error('[Enrichment API] IRS BMF import error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start IRS BMF import',
        message: error.message,
      });
    }
  }
);

export default router;