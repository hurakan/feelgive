# FeelGive - Emotion-Driven Charitable Giving Platform

FeelGive is a platform that connects emotional responses to news with charitable giving, making it easy to donate to relevant causes when you encounter impactful stories.

## 🏗️ Project Structure

```
cozy-phoenix-run/
├── frontend/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions & API client
│   │   └── types/          # TypeScript type definitions
│   └── package.json
│
├── backend/                 # Node.js + Express backend API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   └── server.ts       # Main server file
│   └── package.json
│
└── Documentation files
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier available)
- npm or yarn package manager

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd cozy-phoenix-run

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up MongoDB Atlas

Follow the detailed guide: [`backend/MONGODB_ATLAS_SETUP.md`](backend/MONGODB_ATLAS_SETUP.md)

Quick steps:
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster
3. Create database user
4. Whitelist your IP (0.0.0.0/0 for development)
5. Get connection string

### 3. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your MongoDB Atlas connection string
```

Required in `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/feelgive
JWT_SECRET=your-secret-key-min-32-chars
FRONTEND_URL=http://localhost:5173
```

### 4. Configure Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env if needed
```

Optional in `frontend/.env`:
```env
VITE_NEWS_API_KEY=your_newsapi_key
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_ENABLE_BACKEND=true
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

### 6. Test the Backend API

```bash
cd backend
./test-api.sh
```

## 📚 Documentation

### Backend
- [`backend/README.md`](backend/README.md) - Backend API documentation
- [`backend/DEPLOYMENT.md`](backend/DEPLOYMENT.md) - Deployment guide
- [`backend/MONGODB_ATLAS_SETUP.md`](backend/MONGODB_ATLAS_SETUP.md) - MongoDB setup
- [`backend/RAG_IMPLEMENTATION.md`](backend/RAG_IMPLEMENTATION.md) - RAG system details
- [`backend/WEB_SEARCH_SETUP.md`](backend/WEB_SEARCH_SETUP.md) - Web search configuration

### Frontend
- [`frontend/README.md`](frontend/README.md) - Frontend documentation
- [`frontend/EVERY_ORG_INTEGRATION.md`](frontend/EVERY_ORG_INTEGRATION.md) - Every.org integration details
- [`frontend/CHARITY_SLUG_VERIFICATION_GUIDE.md`](frontend/CHARITY_SLUG_VERIFICATION_GUIDE.md) - Charity verification

### Integration
- [`EVERY_ORG_DYNAMIC_INTEGRATION_SUMMARY.md`](EVERY_ORG_DYNAMIC_INTEGRATION_SUMMARY.md) - **Dynamic Every.org integration guide**
- [`BACKEND_INTEGRATION.md`](BACKEND_INTEGRATION.md) - Complete backend integration guide

## 🎯 Features

### Current Features
- ✅ **Dynamic Every.org Integration** - Real-time access to thousands of verified nonprofits
- ✅ News article classification (disaster relief, health crisis, etc.)
- ✅ Charity matching based on article content
- ✅ Donation tracking and history
- ✅ User preferences and monthly caps
- ✅ MongoDB Atlas backend with RESTful API
- ✅ Secure API with rate limiting
- ✅ RAG-powered chat system with Google Gemini
- ✅ Web search integration for enhanced responses

### Planned Features
- 🔄 User authentication
- 🔄 Real-time donation processing
- 🔄 Impact stories and follow-ups
- 🔄 Monthly donation reports
- 🔄 Social sharing features

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Query** - Data fetching

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB Atlas** - Database
- **Mongoose** - ODM
- **Helmet** - Security
- **Express Validator** - Input validation

## 🔒 Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 req/15min general, 10 req/min donations)
- Input validation on all endpoints
- Environment-based configuration
- MongoDB Atlas encryption at rest

## 📊 API Endpoints

### Organizations (Every.org)
- `GET /api/v1/organizations/search` - Search organizations
- `GET /api/v1/organizations/:slug` - Get organization by slug

### Donations
- `POST /api/v1/donations` - Create donation
- `GET /api/v1/donations` - List donations
- `GET /api/v1/donations/stats` - Get statistics
- `GET /api/v1/donations/monthly-total` - Monthly total

### Users
- `GET /api/v1/users` - Get/create user
- `PATCH /api/v1/users/preferences` - Update preferences
- `GET /api/v1/users/profile` - Get profile

### Classifications
- `POST /api/v1/classifications` - Create classification
- `GET /api/v1/classifications` - List classifications
- `GET /api/v1/classifications/stats` - Get statistics

### Chat (RAG System)
- `POST /api/v1/chat/message` - Send message to AI assistant
- `GET /api/v1/chat/health` - Check chat service health

See [`backend/README.md`](backend/README.md) for detailed API documentation.

## 🧪 Testing

### Backend API Tests
```bash
cd backend
./test-api.sh
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🚢 Deployment

### Backend Deployment Options
1. **Vercel** (Serverless) - See [`backend/DEPLOYMENT.md`](backend/DEPLOYMENT.md)
2. **Railway** - One-click deployment
3. **Render** - Free tier available
4. **Docker** - Containerized deployment
5. **VPS** - Traditional server deployment

### Frontend Deployment
1. **Vercel** - Recommended (already configured)
2. **Netlify** - Alternative option
3. **GitHub Pages** - Static hosting

See deployment guides in respective README files.

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev          # Development with hot reload
npm run build        # Build TypeScript
npm start           # Production mode
npm run lint        # Lint code
```

### Frontend Development
```bash
cd frontend
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview production build
npm run lint        # Lint code
```

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# Every.org Integration
EVERY_ORG_API_PUBLIC_KEY=your-api-key
DONATION_URL=staging.every.org
REDIRECT_URL=http://localhost:5173/donation-success

# Google Gemini (for RAG chat)
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

### Frontend (.env)
```env
VITE_NEWS_API_KEY=your-key
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_ENABLE_BACKEND=true

# Every.org Integration
VITE_ENABLE_EVERY_ORG_PAYMENTS=false
VITE_DONATION_BASE_URL=staging.every.org
VITE_REDIRECT_URL=http://localhost:5173/donation-success
```

See [EVERY_ORG_DYNAMIC_INTEGRATION_SUMMARY.md](EVERY_ORG_DYNAMIC_INTEGRATION_SUMMARY.md) for complete configuration guide.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Backend Issues**: See [`backend/README.md`](backend/README.md)
- **MongoDB Setup**: See [`backend/MONGODB_ATLAS_SETUP.md`](backend/MONGODB_ATLAS_SETUP.md)
- **Integration Help**: See [`BACKEND_INTEGRATION.md`](BACKEND_INTEGRATION.md)

## 🎉 Acknowledgments

- Every.org for charity API
- MongoDB Atlas for database hosting
- shadcn/ui for beautiful components
- All contributors and supporters

## 📞 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for making charitable giving easier and more impactful**