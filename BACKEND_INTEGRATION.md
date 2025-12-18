# FeelGive Backend Integration Guide

This guide explains how to integrate the FeelGive frontend with the MongoDB Atlas backend.

## Overview

The FeelGive application now has a production-ready backend built with:
- **Node.js + Express** - RESTful API server
- **TypeScript** - Type-safe development
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **Security** - Helmet, CORS, rate limiting
- **Validation** - Express-validator for input validation

## Architecture

```
Frontend (React + Vite)
    ↓
API Client (frontend/src/utils/api-client.ts)
    ↓
Backend API (Express Server on port 3001)
    ↓
MongoDB Atlas (Cloud Database)
```

## Quick Start

### 1. Set Up MongoDB Atlas

Follow the detailed instructions in [`backend/DEPLOYMENT.md`](backend/DEPLOYMENT.md) to:
1. Create a MongoDB Atlas account
2. Create a cluster (free M0 tier available)
3. Create a database user
4. Configure network access
5. Get your connection string

### 2. Configure Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your MongoDB Atlas credentials
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/feelgive
```

Required environment variables:
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your-secret-key-min-32-chars
FRONTEND_URL=http://localhost:5173
```

### 3. Install and Run Backend

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Or build and run in production mode
npm run build
npm start
```

The backend will start on `http://localhost:3001`

### 4. Configure Frontend

```bash
cd frontend

# Copy environment template (if not already done)
cp .env.example .env

# Edit .env to enable backend
```

Add to your [`frontend/.env`](frontend/.env):
```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_ENABLE_BACKEND=true
```

### 5. Test the Integration

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173` in your browser
4. Test creating a donation - it should now save to MongoDB Atlas

## API Client Usage

The frontend includes a ready-to-use API client at [`frontend/src/utils/api-client.ts`](frontend/src/utils/api-client.ts).

### Example: Creating a Donation

```typescript
import { apiClient } from '@/utils/api-client';

// Create a donation
const result = await apiClient.createDonation({
  charityId: 'charity_123',
  charityName: 'Red Cross',
  charitySlug: 'american-red-cross',
  amount: 25,
  cause: 'disaster_relief',
  geo: 'US-CA',
  geoName: 'California, USA',
  articleUrl: 'https://example.com/article',
  articleTitle: 'Wildfire Emergency',
  userEmail: 'user@example.com'
});

if (result.success) {
  console.log('Donation created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Example: Getting User Donations

```typescript
import { apiClient } from '@/utils/api-client';

// Get donations for a user
const result = await apiClient.getDonations({
  userEmail: 'user@example.com',
  limit: 10,
  offset: 0
});

if (result.success) {
  console.log('Donations:', result.data.donations);
  console.log('Total:', result.data.pagination.total);
}
```

### Example: Saving Classifications

```typescript
import { apiClient } from '@/utils/api-client';

// Save a classification to the backend
const result = await apiClient.createClassification({
  cause: 'disaster_relief',
  tier1_crisis_type: 'natural_disaster',
  tier2_root_cause: 'climate_driven',
  identified_needs: ['shelter', 'food', 'medical'],
  geo: 'US-CA',
  geoName: 'California, USA',
  affectedGroups: ['residents', 'evacuees'],
  confidence: 0.85,
  articleUrl: 'https://example.com/article',
  matchedKeywords: ['wildfire', 'evacuation'],
  relevantExcerpts: ['Thousands evacuated...'],
  hasMatchingCharities: true,
  severityAssessment: {
    level: 'high',
    peopleAffected: 10000,
    systemStatus: 'overwhelmed',
    imminentRisk: true,
    reasoning: 'Rapidly spreading wildfire'
  }
});
```

## Migrating from localStorage to Backend

The current frontend uses localStorage for data persistence. To migrate to the backend:

### Option 1: Gradual Migration (Recommended)

Use the `VITE_ENABLE_BACKEND` flag to switch between localStorage and backend:

```typescript
// In your donation utility
import { apiClient } from '@/utils/api-client';

const ENABLE_BACKEND = import.meta.env.VITE_ENABLE_BACKEND === 'true';

export async function saveDonation(donation: Donation) {
  if (ENABLE_BACKEND) {
    // Save to backend
    const result = await apiClient.createDonation(donation);
    if (!result.success) {
      console.error('Failed to save to backend:', result.error);
      // Fallback to localStorage
      saveToLocalStorage(donation);
    }
  } else {
    // Use localStorage
    saveToLocalStorage(donation);
  }
}
```

### Option 2: Full Backend Integration

Update [`frontend/src/utils/donations.ts`](frontend/src/utils/donations.ts) to use the API client:

```typescript
import { apiClient } from './api-client';
import { Donation } from '@/types';

export async function saveDonation(donation: Donation): Promise<void> {
  const result = await apiClient.createDonation({
    charityId: donation.charityId,
    charityName: donation.charityName,
    charitySlug: donation.charityId, // Map to slug
    amount: donation.amount,
    cause: donation.cause,
    geo: donation.geo,
    geoName: donation.geo, // Map appropriately
    articleUrl: donation.articleUrl,
    articleTitle: donation.articleTitle,
    userEmail: getUserEmail(), // Get from user context
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to save donation');
  }
}

export async function getDonations(): Promise<Donation[]> {
  const userEmail = getUserEmail();
  const result = await apiClient.getDonations({ userEmail });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch donations');
  }

  return result.data.donations.map(mapBackendDonationToFrontend);
}
```

## Available API Endpoints

### Donations
- `POST /api/v1/donations` - Create donation
- `GET /api/v1/donations` - List donations (with filters)
- `GET /api/v1/donations/stats` - Get statistics
- `GET /api/v1/donations/monthly-total` - Get monthly total

### Users
- `GET /api/v1/users` - Get/create user
- `PATCH /api/v1/users/preferences` - Update preferences
- `GET /api/v1/users/profile` - Get profile with stats

### Classifications
- `POST /api/v1/classifications` - Create classification
- `GET /api/v1/classifications` - List classifications
- `GET /api/v1/classifications/by-article` - Get by article URL
- `GET /api/v1/classifications/stats` - Get statistics

### Health
- `GET /health` - Server health check

See [`backend/README.md`](backend/README.md) for detailed API documentation.

## Data Models

### Donation Model
```typescript
{
  charityId: string;
  charityName: string;
  charitySlug: string;
  amount: number;
  cause: 'disaster_relief' | 'health_crisis' | 'climate_events' | 'humanitarian_crisis' | 'social_justice';
  geo: string;
  geoName: string;
  articleUrl?: string;
  articleTitle?: string;
  userEmail?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}
```

### User Model
```typescript
{
  email: string;
  monthlyCapEnabled: boolean;
  monthlyCap: number;
  totalDonations: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Classification Model
```typescript
{
  cause: string;
  tier1_crisis_type: string;
  tier2_root_cause: string;
  identified_needs: string[];
  geo: string;
  geoName: string;
  confidence: number;
  severityAssessment: {
    level: 'extreme' | 'high' | 'moderate' | 'low';
    systemStatus: string;
    imminentRisk: boolean;
    reasoning: string;
  };
  // ... additional fields
}
```

## Security Features

The backend includes:
- **Helmet.js** - Security headers
- **CORS** - Configured for your frontend URL
- **Rate Limiting** - 100 requests per 15 minutes (general), stricter for donations
- **Input Validation** - All inputs validated with express-validator
- **Error Handling** - Centralized error handling middleware

## Testing the Backend

### Health Check
```bash
curl http://localhost:3001/health
```

### Create a Donation
```bash
curl -X POST http://localhost:3001/api/v1/donations \
  -H "Content-Type: application/json" \
  -d '{
    "charityId": "test_charity",
    "charityName": "Test Charity",
    "charitySlug": "test-charity",
    "amount": 25,
    "cause": "disaster_relief",
    "geo": "US-CA",
    "geoName": "California, USA"
  }'
```

### Get Donations
```bash
curl http://localhost:3001/api/v1/donations
```

## Production Deployment

### Backend Deployment

See [`backend/DEPLOYMENT.md`](backend/DEPLOYMENT.md) for detailed deployment instructions for:
- Vercel (Serverless)
- Railway
- Render
- Docker + Any Cloud Provider
- Traditional VPS

### Frontend Configuration

Update your production frontend environment:
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
VITE_ENABLE_BACKEND=true
```

## Troubleshooting

### Backend won't connect to MongoDB
- Verify your MongoDB Atlas connection string
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure database user has correct permissions

### CORS errors
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that CORS is properly configured in [`backend/src/server.ts`](backend/src/server.ts)

### API requests failing
- Check that backend is running on port 3001
- Verify `VITE_API_BASE_URL` in frontend `.env`
- Check browser console for detailed error messages
- Review backend logs for errors

### Rate limiting issues
- Default: 100 requests per 15 minutes
- Donations: 10 requests per minute
- Adjust in [`backend/src/middleware/rateLimiter.ts`](backend/src/middleware/rateLimiter.ts) if needed

## Development Workflow

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Make Changes**: Edit code with hot reload
4. **Test**: Use browser and API client
5. **Commit**: Commit both frontend and backend changes

## Next Steps

1. ✅ Backend is set up and running
2. ✅ Frontend has API client ready
3. 🔄 Migrate localStorage functions to use API client
4. 🔄 Add user authentication (optional)
5. 🔄 Deploy backend to production
6. 🔄 Update frontend to use production backend URL

## Support

- Backend API Documentation: [`backend/README.md`](backend/README.md)
- Deployment Guide: [`backend/DEPLOYMENT.md`](backend/DEPLOYMENT.md)
- API Client: [`frontend/src/utils/api-client.ts`](frontend/src/utils/api-client.ts)

For issues, check the logs in your deployment platform and MongoDB Atlas metrics.