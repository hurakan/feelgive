import express, { Request, Response } from 'express';
import NewsAPIConfig from '../models/NewsAPIConfig.js';
import NewsArticle from '../models/NewsArticle.js';
import { newsAggregator } from '../services/news-aggregator.js';
import { newsFeedCache } from '../services/news-feed-cache.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/news/configs:
 *   get:
 *     summary: Get all news API configurations
 *     tags: [News]
 *     responses:
 *       200:
 *         description: List of news API configurations
 */
router.get('/configs', async (_req: Request, res: Response) => {
  try {
    const configs = await NewsAPIConfig.find().select('-apiKey'); // Don't expose API keys
    res.json(configs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/configs:
 *   post:
 *     summary: Create a new news API configuration
 *     tags: [News]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - apiKey
 *               - provider
 *               - requestsPerDay
 *             properties:
 *               name:
 *                 type: string
 *               apiKey:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [newsapi, newsdata, currents, guardian, mediastack, gnews]
 *               requestsPerDay:
 *                 type: number
 *               requestsPerHour:
 *                 type: number
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               countries:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Configuration created successfully
 */
router.post('/configs', async (req: Request, res: Response) => {
  try {
    const { name, apiKey, provider, requestsPerDay, requestsPerHour, keywords, countries } = req.body;

    const config = await NewsAPIConfig.create({
      name,
      apiKey,
      provider,
      rateLimit: {
        requestsPerDay,
        requestsPerHour,
        currentDayUsage: 0,
        currentHourUsage: 0,
        lastResetDate: new Date(),
        lastResetHour: new Date(),
      },
      keywords: keywords || [],
      countries: countries || [],
    });

    // Don't return the API key
    const response = config.toObject();
    delete response.apiKey;

    res.status(201).json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/configs/{provider}:
 *   put:
 *     summary: Update a news API configuration
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 */
router.put('/configs/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const updates = req.body;

    // Don't allow updating provider or certain fields directly
    delete updates.provider;
    delete updates.totalArticlesFetched;
    delete updates.lastFetchedAt;
    delete updates.lastSuccessfulFetch;

    const config = await NewsAPIConfig.findOneAndUpdate(
      { provider },
      updates,
      { new: true, runValidators: true }
    ).select('-apiKey');

    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/configs/{provider}/toggle:
 *   patch:
 *     summary: Toggle a news API configuration on/off
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuration toggled successfully
 */
router.patch('/configs/:provider/toggle', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    
    const config = await NewsAPIConfig.findOne({ provider });
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    config.isEnabled = !config.isEnabled;
    await config.save();

    const response = config.toObject();
    delete response.apiKey;

    res.json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/configs/{provider}:
 *   delete:
 *     summary: Delete a news API configuration
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuration deleted successfully
 */
router.delete('/configs/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    
    const config = await NewsAPIConfig.findOneAndDelete({ provider });
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({ message: 'Configuration deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/usage:
 *   get:
 *     summary: Get usage statistics for all news APIs
 *     tags: [News]
 *     responses:
 *       200:
 *         description: Usage statistics
 */
router.get('/usage', async (_req: Request, res: Response) => {
  try {
    const stats = await newsAggregator.getUsageStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/fetch:
 *   post:
 *     summary: Fetch news from all enabled sources
 *     tags: [News]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               countries:
 *                 type: array
 *                 items:
 *                   type: string
 *               limit:
 *                 type: number
 *     responses:
 *       200:
 *         description: News articles fetched successfully
 */
router.post('/fetch', async (req: Request, res: Response) => {
  try {
    const {
      keywords,
      countries,
      limit,
      region = 'global',
      locale = 'en',
      category = 'all',
      sort = 'publishedAt',
      page = 1,
      forceRefresh = false,
    } = req.body;
    
    const result = await newsAggregator.fetchFromAllSources({
      keywords,
      countries,
      limit,
      region,
      locale,
      category,
      sort,
      page,
      forceRefresh,
    });

    res.json({
      count: result.articles.length,
      fromCache: result.fromCache,
      isStale: result.isStale,
      dataSource: result.dataSource,
      articles: result.articles.map(a => ({
        id: a._id,
        title: a.title,
        description: a.description,
        url: a.url,
        imageUrl: a.imageUrl,
        source: a.source,
        apiSource: a.apiSource,
        publishedAt: a.publishedAt,
        classificationStatus: a.classificationStatus,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/articles:
 *   get:
 *     summary: Get stored news articles
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, classified, irrelevant]
 *       - in: query
 *         name: apiSource
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *     responses:
 *       200:
 *         description: List of news articles
 */
router.get('/articles', async (req: Request, res: Response) => {
  try {
    const { status, apiSource, limit = 50, page = 1 } = req.query;
    
    const query: any = {};
    if (status) query.classificationStatus = status;
    if (apiSource) query.apiSource = apiSource;

    const skip = (Number(page) - 1) * Number(limit);
    
    const [articles, total] = await Promise.all([
      NewsArticle.find(query)
        .sort({ publishedAt: -1 })
        .limit(Number(limit))
        .skip(skip)
        .select('-content'), // Don't return full content
      NewsArticle.countDocuments(query),
    ]);

    res.json({
      articles,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/articles/{id}:
 *   get:
 *     summary: Get a specific news article
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: News article details
 */
router.get('/articles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const article = await NewsArticle.findById(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/cache/metrics:
 *   get:
 *     summary: Get news feed cache metrics
 *     tags: [News]
 *     responses:
 *       200:
 *         description: Cache metrics and statistics
 */
router.get('/cache/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = newsFeedCache.getMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/cache/debug:
 *   get:
 *     summary: Get detailed cache debug information
 *     tags: [News]
 *     responses:
 *       200:
 *         description: Detailed cache information
 */
router.get('/cache/debug', async (_req: Request, res: Response) => {
  try {
    const debugInfo = newsFeedCache.getDebugInfo();
    res.json(debugInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/cache/clear:
 *   post:
 *     summary: Clear the news feed cache
 *     tags: [News]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.post('/cache/clear', async (_req: Request, res: Response) => {
  try {
    await newsFeedCache.clear();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/cache/invalidate:
 *   post:
 *     summary: Invalidate specific cache entry
 *     tags: [News]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               region:
 *                 type: string
 *               locale:
 *                 type: string
 *               category:
 *                 type: string
 *               sort:
 *                 type: string
 *               page:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cache entry invalidated
 */
router.post('/cache/invalidate', async (req: Request, res: Response) => {
  try {
    const { region, locale, category, sort, page } = req.body;
    await newsFeedCache.invalidate({
      region: region || 'global',
      locale: locale || 'en',
      category: category || 'all',
      sort: sort || 'publishedAt',
      page: page || 1,
    });
    res.json({ message: 'Cache entry invalidated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;