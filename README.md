# Personal Finance Assistant

A full-stack web application for personal finance management with user authentication, transaction tracking, receipt parsing (OCR), PDF import, and analytics dashboards. Built with React (Vite, Tailwind CSS), Node.js/Express, and MongoDB Atlas.

---

## Features
- User registration, login, JWT authentication  
- Income and expense tracking  
- Transaction list with filters and pagination  
- Analytics dashboards (charts by category/date)  
- Receipt upload with OCR (image/PDF)  
- PDF bank statement import  
- Responsive UI with Tailwind CSS  

---

## Tech Stack
- Frontend: React, Vite, Tailwind CSS  
- Backend: Node.js, Express  
- Database: MongoDB Atlas (Mongoose)  
- OCR: Tesseract.js  
- PDF Parsing: pdf-parse  
- Charts: Chart.js  

---

## Project Structure
typeFace/
├── frontend/ # React app (Vite, Tailwind)
├── backend/ # Express API (Node.js)
└── README.md


---

## Getting Started (Local Development)

### Prerequisites
- Node.js (v16+ recommended)  
- npm or yarn  
- MongoDB Atlas account (connection URI)  

---

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
2. Setup Backend
cd backend
npm install
Create a .env file inside backend/:

PORT=5000
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_atlas_uri
GEMINI_API_KEY=your_google_gemini_api_key
NODE_ENV=development
Start backend server:

npm start
Backend will run on:
http://localhost:5000

3. Setup Frontend
cd frontend
npm install
Create a .env file inside frontend/:

VITE_API_URL=http://localhost:5000/api
Start frontend:

npm run dev
Frontend will run on:
http://localhost:5173 (or as shown in terminal)

API Endpoints (Summary)
POST /api/auth/register Register user

POST /api/auth/login Login

GET /api/auth/profile Get profile

PUT /api/auth/profile Update profile

PUT /api/auth/password Change password

DELETE /api/auth/account Delete account

GET /api/transactions List transactions

POST /api/transactions Add transaction

PUT /api/transactions/:id Update transaction

DELETE /api/transactions/:id Delete transaction

GET /api/transactions/summary Summary

POST /api/transactions/bulk Bulk import

GET /api/analytics/* Analytics endpoints

POST /api/upload/receipt Upload receipt (OCR)

POST /api/upload/statement Upload PDF statement

Database Models
User

username

email

password (hashed)

Transaction

userId

amount

type

category

description

date

receiptUrl

tags

Category

name

type

color

userId

Scripts
Backend
npm start – Start server

npm run dev – Development mode (nodemon)

npm run setup-db – Seed database

npm run test-connection – Test MongoDB connection

Frontend
npm run dev – Start dev server

npm run build – Build for production

npm run preview – Preview production build

npm run lint – Run ESLint

License
MIT