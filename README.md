# Smart Hospital OPD Queue Optimizer

A production-ready full-stack web application for real-time OPD token booking and queue management.

## Tech Stack

*   **Frontend**: React (Vite)
*   **Backend**: Node.js + Express
*   **Database**: MongoDB (Mongoose)
*   **Real-time**: Socket.IO
*   **Auth**: JWT role-based authentication

## Project Structure

```
smart_hosp/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/        # Auth Context
│   │   ├── pages/          # Dashboards (Admin, Doctor, Patient)
│   │   ├── services/       # API & Socket services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js Backend
│   ├── config/             # DB Connection
│   ├── controllers/        # Business Logic
│   ├── middleware/         # Auth Middleware
│   ├── models/             # Mongoose Models (User, Doctor, Token)
│   ├── routes/             # API Routes
│   ├── .env                # Environment Variables
│   ├── index.js            # Server Entry Point
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

*   Node.js (v14+)
*   MongoDB (Local or Atlas)

### 1. Backend Setup

```bash
cd server
npm install
# Create .env file (or use provided .env.example)
cp .env.example .env
# Start the server
npm start
# Server runs on http://localhost:5000
```

**Environment Variables (.env)**:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smart_hosp
JWT_SECRET=your_jwt_secret
```

### 2. Frontend Setup

```bash
cd client
npm install
# Start the development server
npm run dev
# App runs on http://localhost:5173
```

## Usage Guide

1.  **Register Users**:
    *   Go to `/register`.
    *   Register an **ADMIN** (Select role 'Admin').
    *   Register a **DOCTOR** (Select role 'Doctor' - for demo purposes, usually Admin adds doctors).
    *   Register a **PATIENT**.

2.  **Admin Workflow**:
    *   Login as Admin.
    *   Go to Admin Dashboard.
    *   Add a new Doctor (Name, Email, Password, Dept, Avg Time).
    *   View Analytics.

3.  **Doctor Workflow**:
    *   Login as Doctor.
    *   View Live Queue.
    *   Click "Call Patient" (changes status to IN_PROGRESS).
    *   Click "Mark Done" (changes status to DONE).

4.  **Patient Workflow**:
    *   Login as Patient.
    *   View list of doctors.
    *   Book a Token (Normal or Emergency).
    *   View your position in the queue and estimated wait time.
    *   Receive real-time updates when the queue moves.

## API Endpoints

*   `POST /api/auth/register` - Register user
*   `POST /api/auth/login` - Login user
*   `POST /api/doctor` - Add doctor (Admin)
*   `GET /api/doctor` - Get all doctors
*   `POST /api/token/book` - Book token (Patient)
*   `GET /api/queue/:doctorId` - Get queue
*   `PATCH /api/token/:id/status` - Update status (Doctor)
*   `GET /api/analytics/opd` - Get analytics (Admin)

