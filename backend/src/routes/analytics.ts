import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import AnalyticsSession from '../models/AnalyticsSession.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

// Rate limiter for ingest endpoint (high limit for rapid event firing)
const ingestLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100,
  message: 'Too many analytics events, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for admin endpoints (stricter to prevent abuse of expensive queries)
const adminLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 200, // Increased from 60 to handle dashboard with multiple tabs
  message: 'Too many admin requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * /api/v1/analytics/ingest:
 *   post:
 *     summary: Ingest analytics events (batch)
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - events
 *             properties:
 *               events:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - eventType
 *                     - url
 *                     - sessionId
 *                   properties:
 *                     eventType:
 *                       type: string
 *                     eventName:
 *                       type: string
 *                     category:
 *                       type: string
 *                     url:
 *                       type: string
 *                     referrer:
 *                       type: string
 *                     sessionId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     metadata:
 *                       type: object
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   deviceType:
 *                     type: string
 *                   browser:
 *                     type: string
 *                   os:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       202:
 *         description: Events accepted for processing
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/ingest',
  ingestLimiter,
  [
    body('events').isArray({ min: 1 }).withMessage('Events array is required'),
    body('events.*.eventType').notEmpty().withMessage('Event type is required'),
    body('events.*.url').notEmpty().withMessage('URL is required'),
    body('events.*.sessionId').notEmpty().withMessage('Session ID is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { events, deviceInfo } = req.body;

      // Process events in batch
      const eventDocuments = events.map((event: any) => ({
        sessionId: event.sessionId,
        userId: event.userId || undefined,
        eventType: event.eventType,
        eventName: event.eventName,
        category: event.category,
        metadata: event.metadata,
        url: event.url,
        referrer: event.referrer,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      }));

      // Insert events
      await AnalyticsEvent.insertMany(eventDocuments);

      // Update or create session if deviceInfo provided
      if (deviceInfo && events.length > 0) {
        const sessionId = events[0].sessionId;
        const userId = events[0].userId;

        console.log('[Analytics] Creating/updating session:', {
          sessionId,
          userId,
          deviceInfo: {
            deviceType: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            country: deviceInfo.country,
            city: deviceInfo.city
          }
        });

        await AnalyticsSession.findOneAndUpdate(
          { sessionId },
          {
            $set: {
              lastActivity: new Date(),
              deviceType: deviceInfo.deviceType,
              browser: deviceInfo.browser,
              os: deviceInfo.os,
              country: deviceInfo.country,
              city: deviceInfo.city,
              region: deviceInfo.region,
              timezone: deviceInfo.timezone,
              latitude: deviceInfo.latitude,
              longitude: deviceInfo.longitude,
            },
            $setOnInsert: {
              sessionId,
              userId: userId || undefined,
              startTime: new Date(),
            },
            $inc: {
              pageViews: events.filter((e: any) => e.eventType === 'page_view').length,
            },
          },
          { upsert: true, new: true }
        );
      }

      res.status(202).json({
        success: true,
        message: 'Events accepted for processing',
        count: events.length,
      });
    } catch (error) {
      console.error('Error ingesting analytics events:', error);
      res.status(500).json({ error: 'Failed to ingest analytics events' });
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/summary:
 *   get:
 *     summary: Get analytics summary statistics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           default: 7d
 *         description: Time range (e.g., 7d, 30d, 90d)
 *     responses:
 *       200:
 *         description: Summary statistics
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get(
  '/summary',
  adminLimiter,
  isAdmin,
  [query('range').optional().isString()],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { range = '7d' } = req.query;

      // Parse range to get start date
      const rangeMatch = (range as string).match(/^(\d+)([dhm])$/);
      let startDate = new Date();
      
      if (rangeMatch) {
        const value = parseInt(rangeMatch[1]);
        const unit = rangeMatch[2];
        
        if (unit === 'd') {
          startDate.setDate(startDate.getDate() - value);
        } else if (unit === 'h') {
          startDate.setHours(startDate.getHours() - value);
        } else if (unit === 'm') {
          startDate.setMonth(startDate.getMonth() - value);
        }
      } else {
        // Default to 7 days
        startDate.setDate(startDate.getDate() - 7);
      }

      // Aggregate all metrics in a single pipeline for efficiency
      const summaryStats = await AnalyticsSession.aggregate([
        {
          $match: {
            startTime: { $gte: startDate },
          },
        },
        {
          $facet: {
            // Count unique users (userId or anonUserId)
            uniqueUsers: [
              {
                $group: {
                  _id: {
                    $ifNull: ['$userId', '$sessionId'], // Use sessionId as fallback for anonymous users
                  },
                },
              },
              {
                $count: 'count',
              },
            ],
            // Count total sessions
            totalSessions: [
              {
                $count: 'count',
              },
            ],
            // Sum page views
            pageViews: [
              {
                $group: {
                  _id: null,
                  total: { $sum: '$pageViews' },
                },
              },
            ],
            // Calculate bounce rate (sessions with pageViews <= 1)
            bounceRate: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  bounced: {
                    $sum: {
                      $cond: [{ $lte: ['$pageViews', 1] }, 1, 0],
                    },
                  },
                },
              },
              {
                $project: {
                  rate: {
                    $cond: [
                      { $gt: ['$total', 0] },
                      { $multiply: [{ $divide: ['$bounced', '$total'] }, 100] },
                      0,
                    ],
                  },
                },
              },
            ],
            // Calculate average session duration
            avgDuration: [
              {
                $match: {
                  duration: { $exists: true, $ne: null, $gt: 0 },
                },
              },
              {
                $group: {
                  _id: null,
                  avg: { $avg: '$duration' },
                },
              },
            ],
          },
        },
      ]);

      const stats = summaryStats[0];
      const totalUsers = stats.uniqueUsers[0]?.count || 0;
      const totalSessions = stats.totalSessions[0]?.count || 0;
      const totalPageViews = stats.pageViews[0]?.total || 0;
      const bounceRate = stats.bounceRate[0]?.rate || 0;
      const avgSessionDuration = stats.avgDuration[0]?.avg || 0;

      res.json({
        range,
        totalUsers,
        totalSessions,
        totalPageViews,
        avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
      });
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/timeseries:
 *   get:
 *     summary: Get time series data for a specific metric (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: query
 *         name: metric
 *         required: true
 *         schema:
 *           type: string
 *         description: Metric to track (e.g., page_views, sessions, users)
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           default: 30d
 *         description: Time range (e.g., 7d, 30d, 90d)
 *     responses:
 *       200:
 *         description: Time series data
 *       400:
 *         description: Missing required parameters
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get(
  '/timeseries',
  adminLimiter,
  isAdmin,
  [
    query('metric').notEmpty().withMessage('Metric is required'),
    query('range').optional().isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { metric, range = '30d' } = req.query;

      // Parse range
      const rangeMatch = (range as string).match(/^(\d+)([dhm])$/);
      let startDate = new Date();
      
      if (rangeMatch) {
        const value = parseInt(rangeMatch[1]);
        const unit = rangeMatch[2];
        
        if (unit === 'd') {
          startDate.setDate(startDate.getDate() - value);
        } else if (unit === 'h') {
          startDate.setHours(startDate.getHours() - value);
        } else if (unit === 'm') {
          startDate.setMonth(startDate.getMonth() - value);
        }
      } else {
        startDate.setDate(startDate.getDate() - 30);
      }

      let timeseries: any[] = [];

      if (metric === 'page_views') {
        timeseries = await AnalyticsEvent.aggregate([
          {
            $match: {
              eventType: 'page_view',
              timestamp: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
                day: { $dayOfMonth: '$timestamp' },
              },
              value: { $sum: 1 },
            },
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
          },
          {
            $project: {
              _id: 0,
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                },
              },
              value: 1,
            },
          },
        ]);
      } else if (metric === 'sessions') {
        timeseries = await AnalyticsSession.aggregate([
          {
            $match: {
              startTime: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$startTime' },
                month: { $month: '$startTime' },
                day: { $dayOfMonth: '$startTime' },
              },
              value: { $sum: 1 },
            },
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
          },
          {
            $project: {
              _id: 0,
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                },
              },
              value: 1,
            },
          },
        ]);
      } else if (metric === 'users' || metric === 'active_users') {
        // Count unique users per day (userId or sessionId for anonymous)
        timeseries = await AnalyticsSession.aggregate([
          {
            $match: {
              startTime: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$startTime' },
                month: { $month: '$startTime' },
                day: { $dayOfMonth: '$startTime' },
                user: { $ifNull: ['$userId', '$sessionId'] },
              },
            },
          },
          {
            $group: {
              _id: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day',
              },
              value: { $sum: 1 },
            },
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
          },
          {
            $project: {
              _id: 0,
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                },
              },
              value: 1,
            },
          },
        ]);
      } else {
        res.status(400).json({ error: 'Invalid metric. Supported: page_views, sessions, users, active_users' });
        return;
      }

      res.json({
        metric,
        range,
        data: timeseries,
      });
    } catch (error) {
      console.error('Error fetching timeseries data:', error);
      res.status(500).json({ error: 'Failed to fetch timeseries data' });
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/funnels:
 *   get:
 *     summary: Get funnel conversion rates (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           default: 30d
 *         description: Time range (e.g., 7d, 30d, 90d)
 *     responses:
 *       200:
 *         description: Funnel conversion data
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get(
  '/funnels',
  adminLimiter,
  isAdmin,
  [query('range').optional().isString()],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { range = '30d' } = req.query;

      // Parse range
      const rangeMatch = (range as string).match(/^(\d+)([dhm])$/);
      let startDate = new Date();
      
      if (rangeMatch) {
        const value = parseInt(rangeMatch[1]);
        const unit = rangeMatch[2];
        
        if (unit === 'd') {
          startDate.setDate(startDate.getDate() - value);
        } else if (unit === 'h') {
          startDate.setHours(startDate.getHours() - value);
        } else if (unit === 'm') {
          startDate.setMonth(startDate.getMonth() - value);
        }
      } else {
        startDate.setDate(startDate.getDate() - 30);
      }

      // Define funnel steps based on task requirements
      const funnelSteps = [
        { name: 'App Open', eventTypes: ['app_open', 'session_start'] },
        { name: 'Article Open', eventTypes: ['article_opened'] },
        { name: 'Used Chat', eventTypes: ['chat_opened'] },
        { name: 'Donate Click', eventTypes: ['donate_clicked'] },
        { name: 'Donation Success', eventTypes: ['donation_success'] },
      ];

      // Calculate counts for each step using aggregation
      const stepCounts = await Promise.all(
        funnelSteps.map(async (step) => {
          const count = await AnalyticsEvent.countDocuments({
            eventType: { $in: step.eventTypes },
            timestamp: { $gte: startDate },
          });
          return { name: step.name, count };
        })
      );

      // Calculate conversion rates (both from first step and step-to-step)
      const funnel = stepCounts.map((step, index) => {
        const overallConversionRate = index === 0
          ? 100
          : stepCounts[0].count > 0
            ? (step.count / stepCounts[0].count) * 100
            : 0;

        const stepConversionRate = index === 0
          ? 100
          : stepCounts[index - 1].count > 0
            ? (step.count / stepCounts[index - 1].count) * 100
            : 0;

        return {
          step: step.name,
          count: step.count,
          conversionRate: Math.round(overallConversionRate * 100) / 100,
          stepConversionRate: Math.round(stepConversionRate * 100) / 100,
        };
      });

      res.json({
        range,
        funnel,
      });
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      res.status(500).json({ error: 'Failed to fetch funnel data' });
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/locations:
 *   get:
 *     summary: Get user location statistics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           default: 30d
 *         description: Time range (e.g., 7d, 30d, 90d)
 *     responses:
 *       200:
 *         description: Location statistics
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get(
  '/locations',
  adminLimiter,
  isAdmin,
  [query('range').optional().isString()],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { range = '30d' } = req.query;

      // Parse range
      const rangeMatch = (range as string).match(/^(\d+)([dhm])$/);
      let startDate = new Date();
      
      if (rangeMatch) {
        const value = parseInt(rangeMatch[1]);
        const unit = rangeMatch[2];
        
        if (unit === 'd') {
          startDate.setDate(startDate.getDate() - value);
        } else if (unit === 'h') {
          startDate.setHours(startDate.getHours() - value);
        } else if (unit === 'm') {
          startDate.setMonth(startDate.getMonth() - value);
        }
      } else {
        startDate.setDate(startDate.getDate() - 30);
      }

      // Aggregate location data
      const locationStats = await AnalyticsSession.aggregate([
        {
          $match: {
            startTime: { $gte: startDate },
            country: { $exists: true, $ne: null },
          },
        },
        {
          $facet: {
            // Top countries
            byCountry: [
              {
                $group: {
                  _id: '$country',
                  sessions: { $sum: 1 },
                  users: { $addToSet: { $ifNull: ['$userId', '$sessionId'] } },
                },
              },
              {
                $project: {
                  _id: 0,
                  country: '$_id',
                  sessions: 1,
                  users: { $size: '$users' },
                },
              },
              { $sort: { sessions: -1 } },
              { $limit: 10 },
            ],
            // Top cities
            byCities: [
              {
                $match: {
                  city: { $exists: true, $ne: null },
                },
              },
              {
                $group: {
                  _id: { city: '$city', region: '$region', country: '$country' },
                  sessions: { $sum: 1 },
                  users: { $addToSet: { $ifNull: ['$userId', '$sessionId'] } },
                },
              },
              {
                $project: {
                  _id: 0,
                  city: '$_id.city',
                  region: '$_id.region',
                  country: '$_id.country',
                  sessions: 1,
                  users: { $size: '$users' },
                },
              },
              { $sort: { sessions: -1 } },
              { $limit: 10 },
            ],
            // Timezone distribution
            byTimezone: [
              {
                $match: {
                  timezone: { $exists: true, $ne: null },
                },
              },
              {
                $group: {
                  _id: '$timezone',
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  _id: 0,
                  timezone: '$_id',
                  count: 1,
                },
              },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
          },
        },
      ]);

      const stats = locationStats[0];

      res.json({
        range,
        countries: stats.byCountry || [],
        cities: stats.byCities || [],
        timezones: stats.byTimezone || [],
      });
    } catch (error) {
      console.error('Error fetching location data:', error);
      res.status(500).json({ error: 'Failed to fetch location data' });
    }
  }
);
/**
 * @swagger
 * /api/v1/analytics/sessions:
 *   get:
 *     summary: List recent sessions for session explorer (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of sessions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of sessions to skip
 *     responses:
 *       200:
 *         description: List of sessions
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get(
  '/sessions',
  adminLimiter,
  isAdmin,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
    query('sessionIds').optional().isString().withMessage('Session IDs must be a comma-separated string'),
    query('location').optional().isString().withMessage('Location must be a string'),
    query('eventType').optional().isString().withMessage('Event type must be a string'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const sessionIdsParam = req.query.sessionIds as string;
      const locationFilter = req.query.location as string;
      const eventTypeFilter = req.query.eventType as string;

      // Build match criteria
      const matchCriteria: any = {};
      
      // Filter by specific session IDs if provided
      if (sessionIdsParam) {
        const sessionIds = sessionIdsParam.split(',').map(id => id.trim()).filter(id => id);
        if (sessionIds.length > 0) {
          matchCriteria.sessionId = { $in: sessionIds };
        }
      }
      
      // Filter by location if provided
      if (locationFilter) {
        matchCriteria.$or = [
          { city: { $regex: locationFilter, $options: 'i' } },
          { country: { $regex: locationFilter, $options: 'i' } },
        ];
      }

      // Use aggregation to fetch sessions with activity flags
      const pipeline: any[] = [];
      
      // Add match stage if we have filters
      if (Object.keys(matchCriteria).length > 0) {
        pipeline.push({ $match: matchCriteria });
      }
      
      // If filtering by event type, we need to join with events first
      if (eventTypeFilter) {
        pipeline.push(
          {
            $lookup: {
              from: 'analyticsevents',
              localField: 'sessionId',
              foreignField: 'sessionId',
              as: 'events',
            },
          },
          {
            $match: {
              'events.eventType': eventTypeFilter,
            },
          }
        );
      }
      
      pipeline.push(
        {
          $sort: { lastActivity: -1 },
        },
        {
          $skip: offset,
        },
        {
          $limit: limit,
        }
      );
      
      // Add lookup for events if not already added
      if (!eventTypeFilter) {
        pipeline.push({
          $lookup: {
            from: 'analyticsevents',
            localField: 'sessionId',
            foreignField: 'sessionId',
            as: 'events',
          },
        });
      }
      
      pipeline.push(
        {
          $addFields: {
            hasArticleView: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: '$events',
                      as: 'event',
                      cond: { $eq: ['$$event.eventType', 'article_opened'] },
                    },
                  },
                },
                0,
              ],
            },
            hasDonation: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: '$events',
                      as: 'event',
                      cond: {
                        $in: ['$$event.eventType', ['donate_clicked', 'donation_success']],
                      },
                    },
                  },
                },
                0,
              ],
            },
            hasChat: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: '$events',
                      as: 'event',
                      cond: { $eq: ['$$event.eventType', 'chat_opened'] },
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $project: {
            sessionId: 1,
            startTime: 1,
            lastActivity: 1,
            duration: 1,
            pageViews: 1,
            city: 1,
            country: 1,
            deviceType: 1,
            browser: 1,
            os: 1,
            userId: 1,
            hasArticleView: 1,
            hasDonation: 1,
            hasChat: 1,
          },
        }
      );

      // Execute the aggregation pipeline
      const sessions = await AnalyticsSession.aggregate(pipeline);

      // Format sessions for the response
      const formattedSessions = sessions.map((session: any) => ({
        sessionId: session.sessionId,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        duration: session.duration || 0,
        pageViews: session.pageViews || 0,
        location: session.city && session.country
          ? `${session.city}, ${session.country}`
          : session.country || 'Unknown',
        deviceType: session.deviceType || 'Unknown',
        browser: session.browser,
        os: session.os,
        userId: session.userId,
        hasArticleView: session.hasArticleView || false,
        hasDonation: session.hasDonation || false,
        hasChat: session.hasChat || false,
      }));

      // Get total count for pagination
      const total = await AnalyticsSession.countDocuments();

      res.json({
        sessions: formattedSessions,
        total,
        limit,
        offset,
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/sessions/{sessionId}/events:
 *   get:
 *     summary: Get all events for a specific session (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to get events for
 *     responses:
 *       200:
 *         description: List of events for the session
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.get(
  '/sessions/:sessionId/events',
  adminLimiter,
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      // Verify session exists
      const session = await AnalyticsSession.findOne({ sessionId }).lean();
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Fetch all events for this session, sorted by timestamp ascending
      const events = await AnalyticsEvent.find({ sessionId })
        .sort({ timestamp: 1 })
        .lean();

      // Format events for response
      const formattedEvents = events.map((event) => ({
        _id: event._id,
        eventType: event.eventType,
        eventName: event.eventName,
        category: event.category,
        url: event.url,
        referrer: event.referrer,
        timestamp: event.timestamp,
        metadata: event.metadata && event.metadata instanceof Map
          ? Object.fromEntries(event.metadata)
          : event.metadata || {},
      }));

      res.json({
        sessionId,
        session: {
          startTime: session.startTime,
          lastActivity: session.lastActivity,
          duration: session.duration,
          pageViews: session.pageViews,
          deviceType: session.deviceType,
          browser: session.browser,
          os: session.os,
          location: session.city && session.country
            ? `${session.city}, ${session.country}`
            : session.country || 'Unknown',
          userId: session.userId,
        },
        events: formattedEvents,
        totalEvents: events.length,
      });
    } catch (error) {
      console.error('Error fetching session events:', error);
      res.status(500).json({ error: 'Failed to fetch session events' });
    }
  }
);


export default router;