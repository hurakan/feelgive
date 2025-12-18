import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { everyOrgService } from '../services/every-org.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       properties:
 *         slug:
 *           type: string
 *           description: Unique identifier for the organization
 *         name:
 *           type: string
 *           description: Organization name
 *         description:
 *           type: string
 *           description: Organization description
 *         logoUrl:
 *           type: string
 *           description: URL to organization logo
 *         coverImageUrl:
 *           type: string
 *           description: URL to organization cover image
 *         websiteUrl:
 *           type: string
 *           description: Organization website URL
 *         ein:
 *           type: string
 *           description: Employer Identification Number
 *         locationAddress:
 *           type: string
 *           description: Organization address
 *         primaryCategory:
 *           type: string
 *           description: Primary category of the organization
 *         nteeCode:
 *           type: string
 *           description: NTEE classification code
 *         nteeCodeMeaning:
 *           type: string
 *           description: NTEE code description
 */

/**
 * @swagger
 * /api/v1/organizations/search:
 *   get:
 *     summary: Search for organizations on Every.org
 *     tags: [Organizations]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term (optional - returns all organizations if not provided)
 *         example: red cross
 *     responses:
 *       200:
 *         description: List of organizations matching the search
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 organizations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Organization'
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.get(
  '/search',
  [
    query('q')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Search term must be less than 200 characters'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation error', errors: errors.array() });
        return;
      }

      const searchTerm = (req.query.q as string) || '';

      // Fetch organizations from Every.org
      const organizations = await everyOrgService.searchOrganizations(searchTerm);

      res.json({
        success: true,
        count: organizations.length,
        organizations,
      });
    } catch (error) {
      console.error('Error searching organizations:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      res.status(500).json({
        error: 'Failed to search organizations',
        message: errorMessage,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/organizations/{slug}:
 *   get:
 *     summary: Get a specific organization by slug
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization slug
 *         example: american-red-cross
 *     responses:
 *       200:
 *         description: Organization details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 organization:
 *                   $ref: '#/components/schemas/Organization'
 *       404:
 *         description: Organization not found
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
 *                 message:
 *                   type: string
 */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    if (!slug || slug.trim().length === 0) {
      res.status(400).json({ error: 'Organization slug is required' });
      return;
    }

    // Fetch organization by slug
    const organization = await everyOrgService.getOrganizationBySlug(slug);

    if (!organization) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    res.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({
      error: 'Failed to fetch organization',
      message: errorMessage,
    });
  }
});

export default router;