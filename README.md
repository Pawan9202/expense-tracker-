# Personal Finance Assistant - PRO Edition

A production-grade, AI-powered personal finance platform built with the MERN stack. Features intelligent spending insights, automated categorization, receipt OCR, and real-time updates.

---

## Architecture

```
├── backend/                 # Express API (Node.js)
│   ├── config/              # Environment configuration
│   ├── controllers/         # Business logic (future)
│   ├── middleware/         # Auth, validation, rate limiting
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── services/           # AI, cache, storage services
│   ├── tests/              # Jest unit tests
│   ├── utils/              # Logger, helpers
│   └── server.js           # Entry point
│
├── frontend/                # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth, state management
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API clients
│   │   └── App.jsx         # Main application
│   └── nginx.conf          # Production nginx config
│
├── docker-compose.yml       # Full stack orchestration
└── .github/workflows/       # CI/CD pipeline
```

---

## Key Features

### 🔐 Authentication & Security
- JWT-based auth with refresh tokens
- Password hashing with bcrypt
- Rate limiting (express-rate-limit)
- Input validation (express-validator)
- CORS configuration

### 🤖 AI-Powered Features
- **Spending Insights**: Analyzes transactions to provide actionable recommendations
- **Auto-Categorization**: AI suggests categories for new transactions
- **Spending Predictions**: Forecasts future spending based on historical data
- **Financial Health Score**: Calculates overall financial wellness (A-F grade)

### ⚡ Performance
- Redis caching for dashboard & analytics
- Pagination for large datasets
- Indexed MongoDB queries
- WebSocket real-time updates

### 📄 File Storage
- Local filesystem (development)
- AWS S3 (production)
- Cloudinary (production)

### 🐳 DevOps
- Docker & docker-compose
- GitHub Actions CI/CD
- Multi-stage frontend builds

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Chart.js, Recharts |
| Backend | Node.js 20, Express 4, Socket.io |
| Database | MongoDB 7, Mongoose 7 |
| Cache | Redis 7 |
| AI | OpenAI GPT-4o-mini |
| OCR | Tesseract.js |
| Auth | JWT, bcryptjs |
| Testing | Jest, Supertest |
| DevOps | Docker, GitHub Actions |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB (local or Atlas)
- Redis (optional, for caching)

### Local Development

```bash
# 1. Clone and install
git clone https://github.com/your-username/finance-assistant.git
cd finance-assistant

# 2. Backend setup
cd backend
npm install
cp .env.example .env  # Configure your environment

# 3. Frontend setup
cd ../frontend
npm install
cp .env.example .env

# 4. Run with Docker (recommended)
docker-compose up --build

# Or run manually:
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev
```

### Environment Variables

```env
# Backend (.env)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance-assistant
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
OPENAI_API_KEY=sk-...
CORS_ORIGIN=http://localhost:5173
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List (paginated) |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions/:id` | Get single |
| PUT | `/api/transactions/:id` | Update |
| DELETE | `/api/transactions/:id` | Delete |
| GET | `/api/transactions/summary` | Financial summary |
| POST | `/api/transactions/bulk` | Bulk import |

### AI & Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights/spending` | AI spending insights |
| GET | `/api/insights/predict` | Spending prediction |
| GET | `/api/insights/health-score` | Financial health |
| POST | `/api/insights/categorize` | Auto-categorize |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/receipt` | OCR receipt upload |
| POST | `/api/upload/statement` | PDF statement import |

---

## Deployment

### Docker (Recommended)

```bash
# Production build
docker-compose -f docker-compose.yml up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Manual Deploy

**Backend (Render/Railway/AWS)**
```bash
cd backend
npm install --production
npm start
```

**Frontend (Vercel)**
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
```

---

## Running Tests

```bash
cd backend
npm test           # Run all tests
npm run lint       # Lint code
```

---

## Production Checklist

- [ ] Set strong JWT secrets
- [ ] Configure MongoDB Atlas (or secure local)
- [ ] Set up Redis for caching
- [ ] Configure S3/Cloudinary for file storage
- [ ] Set up OpenAI API key
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure backups for MongoDB

---

## License

MIT