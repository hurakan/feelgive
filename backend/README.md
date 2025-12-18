# FeelGive Backend API

Production-ready backend API for FeelGive built with Node.js, Express, TypeScript, and MongoDB Atlas.

## Features

- ✅ RESTful API with Express.js
- ✅ MongoDB Atlas integration with Mongoose
- ✅ TypeScript for type safety
- ✅ Rate limiting and security middleware
- ✅ Input validation with express-validator
- ✅ Error handling and logging
- ✅ CORS configuration
- ✅ Environment-based configuration
- ✅ RAG (Retrieval-Augmented Generation) chat system with Google Gemini
- ✅ Optional web search integration to enhance responses

## Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your MongoDB Atlas credentials:

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/feelgive?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
```

### 3. MongoDB Atlas Setup

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier available)
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and add it to `.env`

### 4. Run the Server

Development mode with hot reload:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Organizations (Every.org Integration)
- `GET /api/v1/organizations/search` - Search for organizations on Every.org
- `GET /api/v1/organizations/:slug` - Get a specific organization by slug

### Donations
- `POST /api/v1/donations` - Create a new donation
- `GET /api/v1/donations` - Get all donations (with filters)
- `GET /api/v1/donations/stats` - Get donation statistics
- `GET /api/v1/donations/monthly-total` - Get current month total for a user

### Users
- `GET /api/v1/users` - Get or create user by email
- `PATCH /api/v1/users/preferences` - Update user preferences
- `GET /api/v1/users/profile` - Get user profile with stats

### Classifications
- `POST /api/v1/classifications` - Create a new classification
- `GET /api/v1/classifications` - Get all classifications (with filters)
- `GET /api/v1/classifications/by-article` - Get classification by article URL
- `GET /api/v1/classifications/stats` - Get classification statistics

### Chat (RAG System)
- `POST /api/v1/chat/message` - Send a message to the AI assistant
- `GET /api/v1/chat/health` - Check chat service health

See [RAG_IMPLEMENTATION.md](./RAG_IMPLEMENTATION.md) for details on the RAG system.
See [WEB_SEARCH_SETUP.md](./WEB_SEARCH_SETUP.md) for web search configuration.

## API Documentation

### Search Organizations

**GET** `/api/v1/organizations/search?q={searchTerm}`

Query parameters:
- `q` (optional) - Search term (returns all organizations if omitted)

Response:
```json
{
  "success": true,
  "count": 150,
  "organizations": [
    {
      "slug": "american-red-cross",
      "name": "American Red Cross",
      "description": "Prevents and alleviates human suffering in the face of emergencies",
      "logoUrl": "https://res.cloudinary.com/everydotorg/...",
      "coverImageUrl": "https://res.cloudinary.com/everydotorg/...",
      "websiteUrl": "https://www.redcross.org",
      "ein": "53-0196605",
      "locationAddress": "Washington, DC",
      "primaryCategory": "Human Services",
      "nteeCode": "P20",
      "nteeCodeMeaning": "Human Service Organizations"
    }
  ]
}
```

### Get Organization by Slug

**GET** `/api/v1/organizations/:slug`

Response:
```json
{
  "success": true,
  "organization": {
    "slug": "american-red-cross",
    "name": "American Red Cross",
    "description": "Prevents and alleviates human suffering...",
    "logoUrl": "https://...",
    "websiteUrl": "https://www.redcross.org",
    "ein": "53-0196605",
    "locationAddress": "Washington, DC",
    "primaryCategory": "Human Services"
  }
}
```

### Create Donation

**POST** `/api/v1/donations`

Request body:
```json
{
  "charityId": "charity_123",
  "charityName": "Red Cross",
  "charitySlug": "american-red-cross",
  "amount": 25,
  "cause": "disaster_relief",
  "geo": "US-CA",
  "geoName": "California, USA",
  "articleUrl": "https://example.com/article",
  "articleTitle": "Wildfire Emergency",
  "userEmail": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "donation": {
    "id": "donation_id",
    "charityId": "charity_123",
    "charityName": "Red Cross",
    "amount": 25,
    "cause": "disaster_relief",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Donations

**GET** `/api/v1/donations?userEmail=user@example.com&limit=10&offset=0`

Query parameters:
- `userEmail` (optional) - Filter by user email
- `cause` (optional) - Filter by cause category
- `geo` (optional) - Filter by geographic location
- `limit` (optional, default: 50) - Number of results
- `offset` (optional, default: 0) - Pagination offset
- `sortBy` (optional, default: createdAt) - Sort field
- `sortOrder` (optional, default: desc) - Sort order

### Create Classification

**POST** `/api/v1/classifications`

Request body:
```json
{
  "cause": "disaster_relief",
  "tier1_crisis_type": "natural_disaster",
  "tier2_root_cause": "climate_driven",
  "identified_needs": ["shelter", "food", "medical"],
  "geo": "US-CA",
  "geoName": "California, USA",
  "affectedGroups": ["residents", "evacuees"],
  "confidence": 0.85,
  "articleTitle": "Wildfire Emergency",
  "articleUrl": "https://example.com/article",
  "matchedKeywords": ["wildfire", "evacuation"],
  "relevantExcerpts": ["Thousands evacuated..."],
  "hasMatchingCharities": true,
  "severityAssessment": {
    "level": "high",
    "peopleAffected": 10000,
    "systemStatus": "overwhelmed",
    "imminentRisk": true,
    "reasoning": "Rapidly spreading wildfire"
  }
}
```

## Database Models

### Donation
- `charityId`: String (required)
- `charityName`: String (required)
- `charitySlug`: String (required)
- `amount`: Number (required, min: 1)
- `cause`: Enum (required)
- `geo`: String (required)
- `geoName`: String (required)
- `articleUrl`: String (optional)
- `articleTitle`: String (optional)
- `userEmail`: String (optional)
- `status`: Enum (default: 'completed')
- `timestamps`: Auto-generated

### User
- `email`: String (required, unique)
- `monthlyCapEnabled`: Boolean (default: false)
- `monthlyCap`: Number (default: 50)
- `totalDonations`: Number (default: 0)
- `totalAmount`: Number (default: 0)
- `timestamps`: Auto-generated

### Classification
- `cause`: Enum (required)
- `tier1_crisis_type`: Enum (required)
- `tier2_root_cause`: Enum (required)
- `identified_needs`: Array of Enums
- `geo`: String (required)
- `geoName`: String (required)
- `confidence`: Number (0-1, required)
- `severityAssessment`: Object (required)
- `timestamps`: Auto-generated

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- Error handling middleware
- Environment-based configuration

## Rate Limits

- General API: 100 requests per 15 minutes
- Donations: 10 requests per minute
- Classifications: 20 requests per minute

## Development

The TypeScript errors shown in the editor are expected before running `npm install`. They will be resolved once dependencies are installed.

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure production MongoDB Atlas connection
3. Set secure `JWT_SECRET`
4. Configure `FRONTEND_URL` to your production domain
5. Build and start:
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 3001 |
| MONGODB_URI | MongoDB connection string | Required |
| JWT_SECRET | JWT signing secret | Required |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:5173 |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 900000 (15 min) |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |
| **EVERY_ORG_API_PUBLIC_KEY** | **Every.org API key** | **Required for organizations** |
| **DONATION_URL** | **Every.org donation base URL** | **www.every.org** |
| **REDIRECT_URL** | **Post-donation redirect URL** | **Required** |
| GOOGLE_GEMINI_API_KEY | Google Gemini API key | Required for chat |
| GEMINI_MODEL_NAME | Gemini model to use | gemini-1.5-flash |
| WEB_SEARCH_ENABLED | Enable web search | false |
| GOOGLE_SEARCH_API_KEY | Google Custom Search API key | Optional |
| GOOGLE_SEARCH_ENGINE_ID | Search engine ID | Optional |

### Every.org Configuration

To enable dynamic organization fetching from Every.org:

1. **Get API Key**: Sign up at [Every.org Partners](https://www.every.org/partners)
2. **Configure Environment**:
   ```env
   # For staging/testing
   EVERY_ORG_API_PUBLIC_KEY=your-api-key
   DONATION_URL=staging.every.org
   REDIRECT_URL=http://localhost:5173/donation-success
   
   # For production
   EVERY_ORG_API_PUBLIC_KEY=your-production-api-key
   DONATION_URL=www.every.org
   REDIRECT_URL=https://yourdomain.com/donation-success
   ```
3. **Test the Integration**:
   ```bash
   curl http://localhost:3001/api/v1/organizations/search?q=red+cross
   ```

## Additional Documentation

- [RAG Implementation Guide](./RAG_IMPLEMENTATION.md) - Details on the RAG chat system
- [Web Search Setup](./WEB_SEARCH_SETUP.md) - How to configure web search
- [MongoDB Atlas Setup](./MONGODB_ATLAS_SETUP.md) - Database setup guide
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Swagger Documentation](./SWAGGER_DOCUMENTATION.md) - API documentation with Swagger

## Support

For issues or questions, please refer to the main project documentation.