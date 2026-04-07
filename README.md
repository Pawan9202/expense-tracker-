# Personal Finance Assistant - PRO Edition

A production-grade, AI-powered personal finance platform built with the MERN stack. Features intelligent spending insights, automated categorization, receipt OCR, WhatsApp bot integration, and real-time updates.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 18)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │Dashboard │  │Transac-  │  │Analytics │  │Budgets & │         │
│  │          │  │tions     │  │& Insights│  │Goals     │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │             │             │              │              │
│  ┌────┴─────────────┴─────────────┴──────────────┴─────────┐    │
│  │     Vite + Tailwind CSS + Framer Motion + Recharts      │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                            │ HTTP/WebSocket                     │
└────────────────────────────┼────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express.js)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Routes Layer                        │   │
│  │  auth │ transactions │ budgets │ goals │ insights │      │   │
│  │  recurring │ upload │ notifications │ export-import │    │   │
│  │  whatsapp                                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Middleware Layer                      │   │
│  │  JWT Auth │ Rate Limit │ Validation │ Error Handler      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Services Layer                        │   │
│  │  AI Service │ OCR Service │ PDF Parser │ Cache Service   │   │
│  │  Storage Service │ Anomaly Detection │ Alert Service     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   ┌─────────┐        ┌──────────┐          ┌──────────┐
   │ MongoDB │        │  Redis   │          │  Twilio  │
   │   (DB)  │        │  (Cache) │          │(WhatsApp)│
   └─────────┘        └──────────┘          └──────────┘
```

---

## Project Structure

```
Expense-Tracker/
├── backend/
│   ├── config/              # Environment configuration
│   ├── middleware/          # Auth, validation, rate limiting, error handling
│   ├── models/              # MongoDB schemas (User, Transaction, Budget, Goal, etc.)
│   ├── routes/              # API endpoints
│   ├── services/            # AI, OCR, cache, storage, alerts
│   ├── utils/               # Logger, helpers
│   ├── tests/               # Jest unit tests
│   └── server.js            # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Modal, QuickAdd, Pagination, Charts
│   │   ├── context/         # AuthContext for global state
│   │   ├── pages/           # Dashboard, Transactions, Analytics, etc.
│   │   ├── services/        # API clients (auth, transaction, analytics, etc.)
│   │   ├── App.jsx          # Main app with routing
│   │   └── main.jsx         # Entry point
│   └── tailwind.config.js   # Tailwind configuration
│
├── docker-compose.yml       # Full stack orchestration
├── .github/workflows/       # CI/CD pipeline
└── README.md
```

---

## Key Features

### 🔐 Authentication & Security
- JWT-based authentication with access & refresh tokens
- Password hashing with bcryptjs
- Rate limiting (express-rate-limit) to prevent brute force
- Input validation (express-validator) on all endpoints
- CORS configuration for secure cross-origin requests
- Token stored in localStorage with auto-refresh mechanism

### 💰 Transaction Management
- Create, read, update, delete transactions
- Income and expense categorization
- Date filtering and pagination
- Search functionality
- Bulk import transactions
- Receipt attachment support
- Quick add modal for fast entry

### 🤖 AI-Powered Features
- **Spending Insights**: Gemini AI analyzes transactions and provides actionable recommendations
- **Auto-Categorization**: AI suggests categories for new transactions based on description
- **Spending Predictions**: Forecasts future spending using historical data analysis
- **Financial Health Score**: Calculates overall wellness grade (A-F) based on savings rate and stability
- **Anomaly Detection**: Identifies unusual spending patterns

### 📄 Receipt & Document Processing
- **OCR Scanning**: Tesseract.js extracts text from receipt images
- **AI Receipt Parsing**: Gemini AI enhances parsing accuracy for amounts, dates, and store names
- **PDF Statement Import**: Parse bank statements and bulk import transactions
- **Smart Categorization**: Auto-categorizes imported data

### 📊 Analytics & Visualization
- Income vs Expense comparison charts
- Category breakdown (pie charts)
- Timeline visualization (bar charts)
- Date range filtering
- Net balance calculation
- Custom chart tooltips with Framer Motion animations

### 💼 Budgeting & Goals
- Set monthly budgets per category
- Progress tracking with visual indicators
- Alert thresholds (80% warning, 100% exceeded)
- Over-budget notifications via WebSocket
- Savings goals with target amounts and deadlines
- Progress visualization

### 🔄 Recurring Transactions
- Schedule recurring income/expenses
- Frequency options: daily, weekly, monthly, yearly
- Auto-tracking for subscriptions
- Toggle activation

### 📱 WhatsApp Bot Integration
- Send transactions via WhatsApp message
- Natural language parsing (e.g., "Lunch for $15")
- Receipt photo processing
- Real-time notifications to web app via WebSocket
- Twilio webhook integration

### ⚡ Real-time Updates
- WebSocket (Socket.io) for live updates
- User-specific rooms for secure communication
- Instant notifications when WhatsApp transactions are added
- Budget alert push notifications

### 📤 Export & Import
- JSON data export
- CSV export for spreadsheet compatibility
- Data backup and restore functionality

### 🐳 DevOps
- Docker & docker-compose for containerization
- GitHub Actions CI/CD pipeline
- Multi-stage frontend builds with nginx
- Redis caching (optional, graceful fallback)
- Winston structured logging

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons |
| **Charts** | Recharts, Chart.js |
| **State** | React Context API |
| **Backend** | Node.js, Express.js, Socket.io |
| **Database** | MongoDB 7, Mongoose 7 |
| **Cache** | Redis 7 (optional) |
| **AI** | Google Gemini API |
| **OCR** | Tesseract.js |
| **Auth** | JWT, bcryptjs |
| **File Upload** | Multer, AWS S3, Cloudinary |
| **Messaging** | Twilio (WhatsApp) |
| **PDF** | pdf-parse |
| **Testing** | Jest, Supertest |
| **DevOps** | Docker, GitHub Actions, nginx |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |
| DELETE | `/api/auth/account` | Delete account |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions (paginated, filtered) |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions/:id` | Get single transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/summary` | Financial summary |
| GET | `/api/transactions/categories` | Get categories with counts |
| POST | `/api/transactions/bulk` | Bulk import transactions |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Dashboard summary |
| GET | `/api/analytics/category-breakdown` | Category-wise breakdown |
| GET | `/api/analytics/timeline` | Timeline data for charts |

### AI & Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights/spending` | AI spending insights |
| GET | `/api/insights/predict` | Spending prediction |
| GET | `/api/insights/health-score` | Financial health grade |
| POST | `/api/insights/categorize` | Auto-categorize transaction |
| GET | `/api/insights/anomalies` | Detect spending anomalies |
| GET | `/api/insights/net-worth` | Net worth history |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | List all budgets |
| POST | `/api/budgets` | Create budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |
| GET | `/api/budgets/progress` | Budget progress tracking |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List all goals |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |

### Recurring Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recurring` | List recurring transactions |
| POST | `/api/recurring` | Create recurring transaction |
| PUT | `/api/recurring/:id` | Update recurring |
| DELETE | `/api/recurring/:id` | Delete recurring |
| PUT | `/api/recurring/:id/toggle` | Toggle active status |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/receipt` | Upload receipt with OCR |
| POST | `/api/upload/statement` | Upload PDF statement |

### Export/Import
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export-import/export` | Export data (JSON/CSV) |
| POST | `/api/export-import/import` | Import data |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

### WhatsApp Bot
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/webhook` | Twilio webhook for incoming messages |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB (local or Atlas)
- Google Gemini API key (for AI features)

### Quick Start with Docker

```bash
# 1. Clone the repository
git clone https://github.com/Pawan9202/expense-tracker-.git
cd expense-tracker-

# 2. Create .env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start all services
docker-compose up --build

# Frontend: http://localhost
# Backend API: http://localhost:5000/api
# API Health: http://localhost:5000/api/health
```

### Manual Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-tracker
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

---

## Deployment

### Docker (Recommended for Production)

```bash
# Production build
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deploy

**Backend** (Render, Railway, AWS):
```bash
cd backend
npm install --production
npm start
```

**Frontend** (Vercel, Netlify):
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

---

## Running Tests

```bash
cd backend
npm test           # Run all tests
npm run lint        # Lint code
```

---

## Features in Action

### Adding a Transaction
1. Use the Quick Add button or navigate to Transactions
2. Enter amount, select type (income/expense), choose category
3. Optionally attach receipt image
4. Transaction saved to MongoDB with budget alerts check

### AI Auto-Categorization
- Enter transaction description
- AI (Gemini) suggests appropriate category
- User confirms or changes category

### WhatsApp Bot
1. Link WhatsApp number in profile settings
2. Send message: "Coffee for $5"
3. Bot parses with Gemini AI
4. Transaction added automatically
5. WebSocket pushes update to web app in real-time

### Budget Alerts
1. Set monthly budget for category (e.g., Food: $500)
2. Add expenses throughout the month
3. At 80% threshold, receive warning notification
4. At 100%, receive exceeded alert
5. Dashboard shows budget progress bars

---

## Production Checklist

- [ ] Set strong JWT secrets (32+ characters)
- [ ] Configure MongoDB Atlas with IP whitelist
- [ ] Set up Redis for production caching
- [ ] Configure AWS S3 or Cloudinary for file storage
- [ ] Add Google Gemini API key
- [ ] Enable HTTPS (use reverse proxy)
- [ ] Configure CORS for production domain
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure automated MongoDB backups
- [ ] Update rate limiting for production traffic

---

## License

MIT
