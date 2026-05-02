# Team Task Manager SaaS

A modern, full-stack Task Management SaaS platform built to help teams organize projects, track tasks, and collaborate efficiently.

## 🚀 Features
- **Secure Authentication:** JWT-based login, signup, and session management.
- **Role-Based Access Control (RBAC):** Admin and Member roles with specific permission levels.
- **Interactive Dashboard:** Live statistics on total, to-do, in-progress, completed, and overdue tasks.
- **Rich Task Management:** 
  - Create tasks with detailed descriptions, deadlines, and priorities.
  - Assign tasks to team members.
  - Set custom reminder dates.
- **Advanced Subtasks:** Add checklists to any task and toggle them on the fly.
- **File Uploads:** Drag-and-drop file attachments directly into tasks.
- **Project Organization:** Group tasks by project and track overall project completion status.
- **Modern UI/UX:** Sleek dark mode design with glassmorphism effects and smooth micro-animations.

## 🛠️ Technology Stack
- **Frontend:** React, Vite, Vanilla CSS
- **Backend:** FastAPI, Python, SQLAlchemy
- **Database:** SQLite (Local) / PostgreSQL (Production)
- **Deployment:** Docker & Railway compatible

## 📦 Local Development Setup

### 1. Backend Setup
Navigate to the backend directory, install the dependencies, and start the FastAPI server.
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # On Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend Setup
Navigate to the frontend directory, install packages, and run the Vite development server.
```bash
cd frontend
npm install
npm run dev
```

## ☁️ Deployment (Railway)
This project is configured as a Monorepo and can be deployed to Railway as a single service.
1. Connect your GitHub repository to Railway.
2. Railway will automatically detect the `Dockerfile` in the root directory.
3. Add a PostgreSQL database to your Railway project if you wish to use a production database (the app will automatically use the `DATABASE_URL` environment variable).
4. The Dockerfile will build the React frontend, package it into the backend, and serve the entire application on a single dynamic port!
