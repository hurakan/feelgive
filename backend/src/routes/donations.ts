import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Donation from '../models/Donation.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DonationInput:
 *       type: object
 *       required:
 *         - charityId
 *         - charityName
 *         - charitySlug
 *         - amount
 *         - cause
 *         - geo
 *         - geoName
 *       properties:
 *         charityId:
 *           type: string
 *           description: Every.org charity ID
 *         charityName:
 *           type: string
 *           description: Name of the charity
 *         charitySlug:
 *           type: string
 *           description: Every.org charity slug
 *         amount:
 *           type: number
 *           minimum: 1
 *           description: Donation amount in USD
 *         cause:
 *           type: string
 *           enum: [disaster_relief, health_crisis, climate_events, humanitarian_crisis, social_justice]
 *           description: Cause category
 *         geo:
 *           type: string
 *           description: Geographic location code
 *         geoName:
 *           type: string
 *           description: Geographic location name
 *         articleUrl:
 *           type: string
 *           description: URL of the article that inspired the donation
 *         articleTitle:
 *           type: string
 *           description: Title of the article
 *         userEmail:
 *           type: string
 *           format: email
 *           description: Email of the donor
 *         paymentProvider:
 *           type: string
 *           description: Payment provider used
 *         paymentId:
 *           type: string
 *           description: Payment transaction ID
 */

// Validation middleware
const validateDonation = [
  body('charityId').notEmpty().withMessage('Charity ID is required'),
  body('charityName').notEmpty().withMessage('Charity name is required'),
  body('charitySlug').notEmpty().withMessage('Charity slug is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  body('cause').isIn(['disaster_relief', 'health_crisis', 'climate_events', 'humanitarian_crisis', 'social_justice']).withMessage('Invalid cause'),
  body('geo').notEmpty().withMessage('Geographic location is required'),
  body('geoName').notEmpty().withMessage('Geographic name is required'),
  body('userEmail').optional().isEmail().withMessage('Invalid email format'),
];

/**
 * @swagger
 * /api/v1/donations:
 *   post:
 *     summary: Create a new donation
 *     tags: [Donations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DonationInput'
 *     responses:
 *       201:
 *         description: Donation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 donation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     charityId:
 *                       type: string
 *                     charityName:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     cause:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or monthly cap exceeded
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
router.post('/', validateDonation, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      charityId,
      charityName,
      charitySlug,
      amount,
      cause,
      geo,
      geoName,
      articleUrl,
      articleTitle,
      userEmail,
      paymentProvider = 'mock',
      paymentId,
    } = req.body;

    // Check monthly cap if user email is provided
    if (userEmail) {
      let user = await User.findOne({ email: userEmail });
      
      if (user && user.monthlyCapEnabled) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyTotal = await Donation.aggregate([
          {
            $match: {
              userEmail: userEmail,
              createdAt: { $gte: startOfMonth },
              status: 'completed',
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);

        const currentMonthTotal = monthlyTotal[0]?.total || 0;
        
        if (currentMonthTotal + amount > user.monthlyCap) {
          res.status(400).json({
            error: 'Monthly cap exceeded',
            message: `This donation would exceed your monthly cap of $${user.monthlyCap}. You've donated $${currentMonthTotal.toFixed(2)} this month.`,
            currentMonthTotal,
            monthlyCap: user.monthlyCap,
          });
          return;
        }
      }
    }

    // Create donation
    const donation = new Donation({
      charityId,
      charityName,
      charitySlug,
      amount,
      cause,
      geo,
      geoName,
      articleUrl,
      articleTitle,
      userEmail,
      status: 'completed',
      paymentProvider,
      paymentId,
    });

    await donation.save();

    // Update user stats if email provided
    if (userEmail) {
      await User.findOneAndUpdate(
        { email: userEmail },
        {
          $inc: {
            totalDonations: 1,
            totalAmount: amount,
          },
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({
      success: true,
      donation: {
        id: donation._id,
        charityId: donation.charityId,
        charityName: donation.charityName,
        amount: donation.amount,
        cause: donation.cause,
        timestamp: donation.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({ error: 'Failed to create donation' });
  }
});

/**
 * @swagger
 * /api/v1/donations:
 *   get:
 *     summary: Get all donations with optional filters
 *     tags: [Donations]
 *     parameters:
 *       - in: query
 *         name: userEmail
 *         schema:
 *           type: string
 *         description: Filter by user email
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
 *         description: List of donations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 donations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Donation'
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
      userEmail,
      cause,
      geo,
      limit = '50',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter: any = { status: 'completed' };
    
    if (userEmail) filter.userEmail = userEmail;
    if (cause) filter.cause = cause;
    if (geo) filter.geo = geo;

    const donations = await Donation.find(filter)
      .sort({ [sortBy as string]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .lean();

    const total = await Donation.countDocuments(filter);

    res.json({
      donations,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + donations.length,
      },
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

/**
 * @swagger
 * /api/v1/donations/stats:
 *   get:
 *     summary: Get donation statistics
 *     tags: [Donations]
 *     parameters:
 *       - in: query
 *         name: userEmail
 *         schema:
 *           type: string
 *         description: Filter statistics by user email
 *     responses:
 *       200:
 *         description: Donation statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overall:
 *                   type: object
 *                   properties:
 *                     totalDonations:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     averageAmount:
 *                       type: number
 *                 byCause:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       total:
 *                         type: number
 *                 byMonth:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: object
 *                         properties:
 *                           year:
 *                             type: integer
 *                           month:
 *                             type: integer
 *                       count:
 *                         type: integer
 *                       total:
 *                         type: number
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userEmail } = req.query;

    const filter: any = { status: 'completed' };
    if (userEmail) filter.userEmail = userEmail;

    const stats = await Donation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
        },
      },
    ]);

    const byCause = await Donation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$cause',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const byMonth = await Donation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    res.json({
      overall: stats[0] || { totalDonations: 0, totalAmount: 0, averageAmount: 0 },
      byCause,
      byMonth,
    });
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    res.status(500).json({ error: 'Failed to fetch donation statistics' });
  }
});

/**
 * @swagger
 * /api/v1/donations/monthly-total:
 *   get:
 *     summary: Get current month donation total for a user
 *     tags: [Donations]
 *     parameters:
 *       - in: query
 *         name: userEmail
 *         required: true
 *         schema:
 *           type: string
 *         description: User email address
 *     responses:
 *       200:
 *         description: Monthly donation total
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentMonthTotal:
 *                   type: number
 *                 donationCount:
 *                   type: integer
 *                 monthlyCapEnabled:
 *                   type: boolean
 *                 monthlyCap:
 *                   type: number
 *       400:
 *         description: Missing userEmail parameter
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
router.get('/monthly-total', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      res.status(400).json({ error: 'userEmail is required' });
      return;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await Donation.aggregate([
      {
        $match: {
          userEmail: userEmail as string,
          createdAt: { $gte: startOfMonth },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const user = await User.findOne({ email: userEmail });

    res.json({
      currentMonthTotal: result[0]?.total || 0,
      donationCount: result[0]?.count || 0,
      monthlyCapEnabled: user?.monthlyCapEnabled || false,
      monthlyCap: user?.monthlyCap || 50,
    });
  } catch (error) {
    console.error('Error fetching monthly total:', error);
    res.status(500).json({ error: 'Failed to fetch monthly total' });
  }
});

export default router;