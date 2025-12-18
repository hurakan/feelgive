import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get or create user by email
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User email address
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing email parameter
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
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.query;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    let user = await User.findOne({ email: email as string });

    if (!user) {
      user = new User({
        email: email as string,
        monthlyCapEnabled: false,
        monthlyCap: 50,
        totalDonations: 0,
        totalAmount: 0,
      });
      await user.save();
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * @swagger
 * /api/v1/users/preferences:
 *   patch:
 *     summary: Update user preferences
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               monthlyCapEnabled:
 *                 type: boolean
 *                 description: Enable or disable monthly donation cap
 *               monthlyCap:
 *                 type: number
 *                 minimum: 0
 *                 description: Monthly donation cap amount in USD
 *     responses:
 *       200:
 *         description: User preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
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
router.patch('/preferences', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('monthlyCapEnabled').optional().isBoolean(),
  body('monthlyCap').optional().isFloat({ min: 0 }),
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, monthlyCapEnabled, monthlyCap } = req.body;

    const updateData: any = {};
    if (monthlyCapEnabled !== undefined) updateData.monthlyCapEnabled = monthlyCapEnabled;
    if (monthlyCap !== undefined) updateData.monthlyCap = monthlyCap;

    const user = await User.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({ user });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
});

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get user profile with donation statistics
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User email address
 *     responses:
 *       200:
 *         description: User profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                     totalDonations:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     averageDonation:
 *                       type: number
 *                     monthlyCapEnabled:
 *                       type: boolean
 *                     monthlyCap:
 *                       type: number
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing email parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.query;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email: email as string });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      profile: {
        email: user.email,
        totalDonations: user.totalDonations,
        totalAmount: user.totalAmount,
        averageDonation: user.totalDonations > 0 ? user.totalAmount / user.totalDonations : 0,
        monthlyCapEnabled: user.monthlyCapEnabled,
        monthlyCap: user.monthlyCap,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;