import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FeelGive API',
      version: '1.0.0',
      description: 'API documentation for FeelGive - A platform for emotion-driven charitable giving',
      contact: {
        name: 'FeelGive Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.feelgive.com',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Donation: {
          type: 'object',
          required: ['charityId', 'charityName', 'charitySlug', 'amount', 'cause', 'geo', 'geoName'],
          properties: {
            _id: {
              type: 'string',
              description: 'Donation ID',
            },
            charityId: {
              type: 'string',
              description: 'Every.org charity ID',
            },
            charityName: {
              type: 'string',
              description: 'Name of the charity',
            },
            charitySlug: {
              type: 'string',
              description: 'Every.org charity slug',
            },
            amount: {
              type: 'number',
              minimum: 1,
              description: 'Donation amount in USD',
            },
            cause: {
              type: 'string',
              enum: ['disaster_relief', 'health_crisis', 'climate_events', 'humanitarian_crisis', 'social_justice'],
              description: 'Cause category',
            },
            geo: {
              type: 'string',
              description: 'Geographic location code',
            },
            geoName: {
              type: 'string',
              description: 'Geographic location name',
            },
            articleUrl: {
              type: 'string',
              description: 'URL of the article that inspired the donation',
            },
            articleTitle: {
              type: 'string',
              description: 'Title of the article',
            },
            userEmail: {
              type: 'string',
              format: 'email',
              description: 'Email of the donor',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              description: 'Donation status',
            },
            paymentProvider: {
              type: 'string',
              description: 'Payment provider used',
            },
            paymentId: {
              type: 'string',
              description: 'Payment transaction ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        User: {
          type: 'object',
          required: ['email'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            monthlyCapEnabled: {
              type: 'boolean',
              description: 'Whether monthly donation cap is enabled',
            },
            monthlyCap: {
              type: 'number',
              minimum: 0,
              description: 'Monthly donation cap amount in USD',
            },
            totalDonations: {
              type: 'number',
              description: 'Total number of donations made',
            },
            totalAmount: {
              type: 'number',
              description: 'Total amount donated in USD',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Classification: {
          type: 'object',
          required: ['cause', 'tier1_crisis_type', 'tier2_root_cause', 'geo', 'geoName', 'confidence'],
          properties: {
            _id: {
              type: 'string',
              description: 'Classification ID',
            },
            cause: {
              type: 'string',
              enum: ['disaster_relief', 'health_crisis', 'climate_events', 'humanitarian_crisis', 'social_justice'],
              description: 'Primary cause category',
            },
            tier1_crisis_type: {
              type: 'string',
              enum: ['natural_disaster', 'health_emergency', 'conflict_displacement', 'climate_disaster', 'human_rights_violation', 'none'],
              description: 'Crisis type classification',
            },
            tier2_root_cause: {
              type: 'string',
              enum: ['climate_driven', 'conflict_driven', 'poverty_driven', 'policy_driven', 'natural_phenomenon', 'systemic_inequality', 'multiple_factors', 'unknown'],
              description: 'Root cause analysis',
            },
            geo: {
              type: 'string',
              description: 'Geographic location code',
            },
            geoName: {
              type: 'string',
              description: 'Geographic location name',
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Classification confidence score',
            },
            articleUrl: {
              type: 'string',
              description: 'URL of the classified article',
            },
            articleTitle: {
              type: 'string',
              description: 'Title of the article',
            },
            excerpt: {
              type: 'string',
              description: 'Relevant excerpt from the article',
            },
            reasoning: {
              type: 'string',
              description: 'Explanation of the classification',
            },
            severityAssessment: {
              type: 'object',
              properties: {
                level: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                  description: 'Severity level',
                },
                factors: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description: 'Factors contributing to severity',
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Classification timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Validation errors',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Donations',
        description: 'Donation management endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Classifications',
        description: 'Content classification endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/server.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);