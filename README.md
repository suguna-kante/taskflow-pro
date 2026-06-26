# TaskFlow Pro

A full-stack task management application built with **React**, **Node.js**, **Express.js**, **PostgreSQL**, and **Gemini AI**.

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, React Router, Recharts, Axios |
| Backend   | Node.js, Express.js                     |
| Database  | PostgreSQL                              |
| Auth      | JWT (access + refresh tokens)           |
| AI        | Google Gemini API (gemini-1.5-flash)    |

---

## AI Features

| Feature               | How to use                                      |
|-----------------------|-------------------------------------------------|
| 🎯 Suggest Priority   | In task modal → click "🎯 AI" next to Priority  |
| ✨ Improve Description| In task modal → click "✨ AI Improve"           |
| 🔧 Task Breakdown     | Topbar → 🤖 AI → Breakdown tab                  |
| 📊 Daily Summary      | Topbar → 🤖 AI → Daily Summary tab              |
| 💬 AI Chat            | Topbar → 🤖 AI → Chat tab                       |

> **Note:** AI features require a `GEMINI_API_KEY` in the backend `.env` file.  
> Get one free at https://aistudio.google.com

---

## Prerequisites

- Node.js v18+
- PostgreSQL 14+
- npm

---

## Setup Instructions

### 1. Clone / Extract the project

```
taskflow-pro/
├── backend/
└── frontend/
```

---

### 2. Set up PostgreSQL database

Open psql or pgAdmin and run:

```sql
CREATE DATABASE taskflow_pro;
```

---

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow_pro
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=any-long-random-string-here
JWT_REFRESH_SECRET=another-long-random-string
GEMINI_API_KEY=your_gemini_api_key_here    # Get from aistudio.google.com
CLIENT_URL=http://localhost:3000
```

---

### 4. Install backend dependencies and run migrations

```bash
cd backend
npm install
npm run migrate
```

You should see: `✅  Migrations complete — all tables created.`

---

### 5. Start the backend server

```bash
npm run dev       # development (auto-restart on changes)
# or
npm start         # production
```

Backend runs at → http://localhost:5000  
Health check → http://localhost:5000/health

---

### 6. Configure and start the frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

Frontend runs at → http://localhost:3000

---

## Project Structure

```
backend/
├── src/
│   ├── server.js                  # Express app entry point
│   ├── db/
│   │   ├── pool.js                # PostgreSQL connection pool
│   │   └── migrate.js             # Run once to create tables
│   ├── middleware/
│   │   └── auth.js                # JWT authentication middleware
│   ├── controllers/
│   │   ├── authController.js      # Register, login, refresh, logout
│   │   ├── userController.js      # Profile, change password
│   │   ├── taskController.js      # Full task CRUD + stats + export
│   │   ├── projectController.js   # Projects + comments
│   │   └── aiController.js        # All AI features (Gemini)
│   └── routes/
│       └── index.js               # All API routes
└── .env.example

frontend/
├── src/
│   ├── api/taskAPI.js             # Axios API calls (incl. AI endpoints)
│   ├── components/
│   │   ├── ai/AIAssistant.jsx     # AI side panel (chat, priority, etc.)
│   │   ├── kanban/                # Kanban board components
│   │   ├── layout/
│   │   │   ├── Topbar.jsx         # Top bar with 🤖 AI button
│   │   │   └── Sidebar.jsx        # Navigation sidebar
│   │   └── modals/TaskModal.jsx   # Task form with inline AI buttons
│   ├── context/                   # React contexts (Auth, Task, Theme)
│   ├── pages/                     # Dashboard, Board, Tasks, etc.
│   └── styles/global.css
└── .env.example
```

---

## API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh/
POST /api/auth/logout
```

### Tasks
```
GET    /api/tasks          ?status=&priority=&project=&search=&ordering=
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/move     { status }
GET    /api/tasks/stats
GET    /api/tasks/overdue
GET    /api/tasks/export       (downloads CSV)
```

### Projects & Comments
```
GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id

GET    /api/tasks/:taskId/comments
POST   /api/tasks/:taskId/comments
DELETE /api/tasks/:taskId/comments/:commentId
```

### AI (all require valid JWT)
```
POST /api/ai/suggest-priority       { title, description }
POST /api/ai/breakdown              { title, description }
POST /api/ai/improve-description    { title, description }
GET  /api/ai/daily-summary
POST /api/ai/chat                   { message, context[] }
```

---

## Common Issues

**"GEMINI_API_KEY not set"** → Add your key to `backend/.env`  
**DB connection refused** → Make sure PostgreSQL is running and credentials match `.env`  
**Port already in use** → Change `PORT=5000` in `.env` and update `REACT_APP_API_URL` in `frontend/.env`  
**CORS errors** → Make sure `CLIENT_URL=http://localhost:3000` in backend `.env`