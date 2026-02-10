# CITT - Centre for Innovation and Technology Transfer Management System

A full-stack web application for managing innovations, research projects, intellectual property, funding, events, and startups at Mbeya University of Science and Technology (MUST).

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [User Roles & Permissions](#user-roles--permissions)
- [Features](#features)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Security](#security)

---

## Overview

The CITT Management System supports MUST's Centre for Innovation and Technology Transfer in managing the full lifecycle of innovations — from project submission and IP registration to funding applications and event participation. The system provides role-based dashboards, real-time notifications, audit logging, and analytics for administrators, IP managers, and innovators.

---

## Tech Stack

### Backend

| Technology       | Purpose                        |
|------------------|--------------------------------|
| Express.js 5.x   | Web server framework           |
| PostgreSQL       | Relational database            |
| JSON Web Tokens  | Authentication & authorization |
| bcrypt           | Password hashing               |
| Firebase Admin   | OAuth / Google Sign-in         |
| Multer           | File upload handling           |
| dotenv           | Environment configuration      |

### Frontend

| Technology        | Purpose                      |
|-------------------|------------------------------|
| React 19.x        | UI framework                 |
| Vite              | Build tool & dev server      |
| Tailwind CSS 4.x  | Utility-first styling        |
| React Router 7.x  | Client-side routing          |
| Axios             | HTTP client                  |
| Chart.js          | Data visualisation           |
| Firebase SDK      | OAuth client-side auth       |
| Lucide React      | Icon library                 |

---

## Project Structure

```
Project_CITT/
├── CITT_Server/                   # Backend (Express + PostgreSQL)
│   ├── config/
│   │   ├── roles.js               # Role definitions & hierarchy
│   │   └── permissions.js         # Permission configuration
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication
│   │   ├── roleAuth.js            # Role-based access control
│   │   ├── auditLog.js            # Activity logging
│   │   └── errorHandler.js        # Centralised error handling
│   ├── routes/
│   │   ├── auth.js                # Authentication endpoints
│   │   ├── admin.js               # Admin operations
│   │   ├── superAdmin.js          # Super admin operations
│   │   ├── ipManager.js           # IP management operations
│   │   ├── events.js              # Events management
│   │   ├── analytics.js           # Dashboard analytics
│   │   └── gallery.js             # Gallery image management
│   ├── migrations/                # SQL migration files (001–010)
│   ├── uploads/                   # User-uploaded files
│   ├── server.js                  # Application entry point
│   ├── package.json
│   └── .env                       # Environment variables
│
├── CITT_Client/                   # Frontend (React + Vite)
│   └── src/
│       ├── Pages/
│       │   ├── admin/             # Admin-only pages
│       │   ├── superadmin/        # Super admin pages
│       │   ├── ipmanager/         # IP manager pages
│       │   ├── dashboards/        # Role-specific dashboards
│       │   └── *.jsx              # Shared & public pages
│       ├── components/            # Reusable UI components
│       ├── context/
│       │   ├── AuthContext.jsx     # Authentication state
│       │   └── LanguageContext.jsx # Internationalisation
│       ├── App.jsx                # Root component & routing
│       ├── firebase.js            # Firebase configuration
│       └── main.jsx               # Entry point
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** 14 or higher
- **npm** v9 or higher
- A **Firebase** project with a service account key (for Google OAuth)

### Backend Setup

```bash
cd CITT_Server
npm install
```

Create a `.env` file in `CITT_Server/` (see [Environment Variables](#environment-variables)), then start the server:

```bash
# Development (auto-reload with nodemon)
npm run dev

# Production
npm start
```

The backend runs on `http://localhost:5000` by default.

### Frontend Setup

```bash
cd CITT_Client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` (or `5174` if the port is in use).

### Database Setup

1. Create a PostgreSQL database and user:

```sql
CREATE DATABASE citt_db;
CREATE USER citt_users WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE citt_db TO citt_users;
```

2. Run the migration files in order:

```bash
cd CITT_Server
npm run migrate
```

Or manually execute each SQL file in `migrations/` (001 through 010) against the database.

---

## Environment Variables

Create a `.env` file inside `CITT_Server/` with the following:

| Variable                       | Description                              | Example              |
|--------------------------------|------------------------------------------|----------------------|
| `DB_HOST`                      | PostgreSQL host                          | `localhost`          |
| `DB_PORT`                      | PostgreSQL port                          | `5432`               |
| `DB_USER`                      | Database user                            | `citt_users`         |
| `DB_PASSWORD`                  | Database password                        | `your_password`      |
| `DB_NAME`                      | Database name                            | `citt_db`            |
| `PORT`                         | Server port                              | `5000`               |
| `JWT_SECRET`                   | Secret key for signing JWT tokens        | A long random string |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase service account JSON  | `./service-account.json` |

---

## User Roles & Permissions

The system has four roles arranged in a hierarchy:

### Super Administrator (`superAdmin`)

Full system control. Can manage all users, assign roles, view audit logs, inspect database information, configure permissions, and access every feature available to lower roles.

### Administrator (`admin`)

Manages day-to-day operations. Can approve or reject project and funding submissions, manage users (without changing roles), upload gallery images, create and publish events, and view analytics and audit logs.

### IP Manager (`ipManager`)

Handles intellectual property workflows. Can review and approve/reject IP submissions, view IP statistics and analytics, and manage IP records. Cannot manage users, funding, or events.

### Innovator (`innovator`)

The default role for registered users. Can submit projects, apply for funding, register IP, participate in events, and manage their own profile and submissions. Read-only access to public content.

---

## Features

### Project Management
Submit innovation and research projects with full lifecycle tracking. Administrators review, approve, or reject submissions with optional feedback. Projects progress through statuses: submitted, in progress, and completed.

### Funding Management
Apply for funding with detailed proposals including amounts and grant types. Administrators manage the approval pipeline with status tracking from application through disbursement to completion. Supports approved amount tracking.

### Intellectual Property Management
Register and manage IP records through a dedicated workflow. IP Managers review submissions and handle approvals. Includes statistics and analytics dashboards specific to IP operations.

### Events System
Create and publish events of various types — hackathons, workshops, challenges, exhibitions, seminars, and conferences. Users submit entries with team details, descriptions, and file attachments. Administrators provide feedback and track submission statuses through review stages.

### Gallery
Public image gallery showcasing innovation events and activities. Administrators upload and manage images through a dedicated management interface. Accessible to all visitors without authentication.

### Dashboards & Analytics
Each role has a tailored dashboard displaying relevant metrics. Includes real-time data updates via polling, interactive charts built with Chart.js, and comprehensive statistics across users, projects, funding, IP records, and events.

### Notifications
Automatic notifications triggered by key actions — project approvals/rejections, funding decisions, IP application outcomes, and event publications. Users receive notifications via an in-app bell icon with a 30-second polling interval.

### Audit Logging
All significant actions are logged with user details, timestamps, IP addresses, and user agents. Super administrators and administrators can view, filter, and export audit logs as CSV or PDF.

### User Management
Registration via email/password or Google OAuth. Profile management with university, college, and year of study fields. Super administrators can create admin and IP manager accounts directly. Soft-delete support preserves data integrity.

---

## API Reference

### Authentication — `/api/auth`

| Method | Endpoint                | Access  | Description                     |
|--------|-------------------------|---------|---------------------------------|
| POST   | `/api/auth/register`    | Public  | Register with email & password  |
| POST   | `/api/auth/firebase-register` | Public | Register via Google OAuth |
| POST   | `/api/auth/login`       | Public  | Login and receive JWT token     |
| POST   | `/api/auth/set-password`| Protected | Set password (OAuth users)   |
| POST   | `/api/auth/change-password` | Protected | Change existing password  |
| GET    | `/api/auth/me`          | Protected | Get current user profile     |
| PUT    | `/api/auth/me`          | Protected | Update own profile           |

### Admin — `/api/admin`

| Method | Endpoint                          | Access       | Description                  |
|--------|-----------------------------------|--------------|------------------------------|
| GET    | `/api/admin/users`                | Admin+       | List users with filters      |
| GET    | `/api/admin/projects`             | Admin+       | List project submissions     |
| PUT    | `/api/admin/projects/:id/approve` | Admin+       | Approve a project            |
| PUT    | `/api/admin/projects/:id/reject`  | Admin+       | Reject a project             |
| GET    | `/api/admin/funding`              | Admin+       | List funding applications    |
| PUT    | `/api/admin/funding/:id/approve`  | Admin+       | Approve funding              |
| PUT    | `/api/admin/funding/:id/reject`   | Admin+       | Reject funding               |

### Super Admin — `/api/superadmin`

| Method | Endpoint                          | Access       | Description                  |
|--------|-----------------------------------|--------------|------------------------------|
| GET    | `/api/superadmin/system/stats`    | SuperAdmin   | System-wide statistics       |
| GET    | `/api/superadmin/analytics`       | SuperAdmin   | Detailed analytics           |
| GET    | `/api/superadmin/users`           | SuperAdmin   | All users with role info     |
| POST   | `/api/superadmin/users`           | SuperAdmin   | Create admin/IP manager      |
| PUT    | `/api/superadmin/users/:id/role`  | SuperAdmin   | Change user role             |
| GET    | `/api/superadmin/audit-logs`      | SuperAdmin   | View audit logs              |
| GET    | `/api/superadmin/database/info`   | SuperAdmin   | Database table information   |

### IP Manager — `/api/ipmanager`

| Method | Endpoint                              | Access     | Description                |
|--------|---------------------------------------|------------|----------------------------|
| GET    | `/api/ipmanager/dashboard`            | IP Manager+ | Dashboard statistics      |
| GET    | `/api/ipmanager/records`              | IP Manager+ | All IP records            |
| GET    | `/api/ipmanager/pending`              | IP Manager+ | Pending IP approvals      |
| PUT    | `/api/ipmanager/ip-records/:id/approve` | IP Manager+ | Approve IP record       |
| PUT    | `/api/ipmanager/ip-records/:id/reject`  | IP Manager+ | Reject IP record        |

### Events — `/api/events`

| Method | Endpoint                            | Access     | Description                  |
|--------|-------------------------------------|------------|------------------------------|
| GET    | `/api/events`                       | Public     | List published events        |
| POST   | `/api/events`                       | Admin+     | Create event                 |
| PUT    | `/api/events/:id`                   | Admin+     | Update event                 |
| PUT    | `/api/events/:id/publish`           | Admin+     | Publish/unpublish event      |
| POST   | `/api/events/:id/submissions`       | Protected  | Submit to an event           |
| GET    | `/api/events/:id/submissions`       | Admin+     | View event submissions       |

### Analytics — `/api/analytics`

| Method | Endpoint                    | Access  | Description                        |
|--------|-----------------------------|---------|------------------------------------|
| GET    | `/api/analytics/dashboard`  | Admin+  | Comprehensive dashboard statistics |

### Gallery — `/api/gallery`

| Method | Endpoint              | Access  | Description            |
|--------|-----------------------|---------|------------------------|
| GET    | `/api/gallery`        | Public  | List gallery images    |
| POST   | `/api/gallery`        | Admin+  | Upload image           |
| DELETE | `/api/gallery/:id`    | Admin+  | Delete image           |

### Notifications — `/api/notifications`

| Method | Endpoint                            | Access    | Description              |
|--------|-------------------------------------|-----------|--------------------------|
| GET    | `/api/notifications`                | Protected | Get user notifications   |
| PUT    | `/api/notifications/:id/read`       | Protected | Mark as read             |
| PUT    | `/api/notifications/mark-all-read`  | Protected | Mark all as read         |
| DELETE | `/api/notifications/:id`            | Protected | Delete a notification    |

### Search — `/api/search`

| Method | Endpoint                      | Access    | Description                      |
|--------|-------------------------------|-----------|----------------------------------|
| GET    | `/api/search?keyword=<term>`  | Protected | Search across events and users   |

---

## Database Schema

The system uses 10 migration files that create and maintain the following tables:

| Table                  | Purpose                                      |
|------------------------|----------------------------------------------|
| `users`                | User accounts, roles, and profile data       |
| `projects`             | Innovation and research project submissions  |
| `funding`              | Funding applications and approval tracking   |
| `ip_management`        | Intellectual property records                |
| `events`               | Events (hackathons, workshops, etc.)         |
| `event_submissions`    | User submissions to events                   |
| `submission_files`     | Files attached to event submissions          |
| `submission_feedback`  | Reviewer feedback on submissions             |
| `notifications`        | In-app user notifications                    |
| `gallery_images`       | Uploaded gallery images                      |
| `audit_logs`           | System activity audit trail                  |

All user-facing tables support soft deletes via a `deleted_at` timestamp column.

---

## Authentication

The system uses a dual authentication approach:

**JWT (Primary)** — Users log in with email and password. The server returns a signed JWT token valid for 24 hours. All protected API requests include this token in the `Authorization: Bearer <token>` header. The middleware verifies the token and fetches fresh user data from the database on each request, ensuring role changes take effect immediately.

**Firebase OAuth (Secondary)** — Users can sign in with Google via Firebase. On first sign-in, the system creates a local user record linked by Firebase UID. Users authenticated via OAuth can optionally set a local password for direct login.

---

## Security

- **Password Hashing** — bcrypt with 10 salt rounds
- **Token Expiration** — JWT tokens expire after 24 hours
- **Parameterised Queries** — All database queries use parameterised inputs to prevent SQL injection
- **Role Enforcement** — Middleware-level role checks on every protected endpoint
- **Soft Deletes** — User data is logically deleted, preserving referential integrity
- **Audit Trail** — All significant actions logged with user, timestamp, IP address, and user agent
- **CORS** — Configured to allow only the frontend origin

---

Built for the Centre for Innovation and Technology Transfer (CITT) at Mbeya University of Science and Technology.
