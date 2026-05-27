# CITT - Centre for Innovation and Technology Transfer Management System

A full-stack web application for managing innovations, research projects, intellectual property, funding, events, and startups at Mbeya University of Science and Technology (MUST).


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
- [Departments](#departments)
- [Features](#features)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Security](#security)



## Overview

The CITT Management System supports MUST's Centre for Innovation and Technology Transfer in managing the full lifecycle of innovations — from project submission and milestone tracking to IP registration, funding applications, and event participation. The system provides role-based dashboards and workspaces, real-time notifications, audit logging, and analytics for a 11-role hierarchy spanning administrators, department directors, mentors, technical committees, coordinators, IP managers, and innovators.



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



## Project Structure

```
Project_CITT/
├── CITT_Server/                   # Backend (Express + PostgreSQL)
│   ├── config/
│   │   ├── roles.js               # Role definitions, hierarchy & helpers
│   │   ├── permissions.js         # Permission configuration
│   │   └── database.js            # Shared PostgreSQL connection pool
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
│   │   ├── gallery.js             # Gallery image management
│   │   ├── milestones.js          # Project milestone tracking
│   │   ├── departments.js         # Department management
│   │   └── mentorWorkspace.js     # Mentor/TC/Coordinator workspace
│   ├── migrations/                # SQL migration files (001–014)
│   ├── scripts/                   # Utility scripts (migrations, test accounts)
│   ├── uploads/                   # User-uploaded files
│   ├── utils/
│   │   ├── notifications.js       # Notification helpers
│   │   ├── pagination.js          # Query pagination helpers
│   │   └── roleHelpers.js         # Role utility functions
│   ├── server.js                  # Application entry point
│   ├── package.json
│   └── .env                       # Environment variables
│
├── CITT_Client/                   # Frontend (React + Vite)
│   └── src/
│       ├── Pages/
│       │   ├── admin/             # Admin-only pages
│       │   │   ├── ProjectApprovals.jsx
│       │   │   ├── ProjectAssignments.jsx
│       │   │   ├── FundingManagement.jsx
│       │   │   ├── UserManagement.jsx
│       │   │   ├── AdminGallery.jsx
│       │   │   ├── AdminSubmissions.jsx
│       │   │   └── Analytics.jsx
│       │   ├── superadmin/        # Super admin pages
│       │   │   ├── RoleManagement.jsx
│       │   │   ├── AuditLogs.jsx
│       │   │   ├── SystemStats.jsx
│       │   │   ├── DatabaseInfo.jsx
│       │   │   ├── Analytics.jsx
│       │   │   ├── Permissions.jsx
│       │   │   └── PastUsers.jsx
│       │   ├── ipmanager/         # IP manager pages
│       │   ├── dashboards/        # Role-specific dashboards & workspaces
│       │   │   ├── AdminDashboard.jsx
│       │   │   ├── SuperAdminDashboard.jsx
│       │   │   ├── IPManagerDashboard.jsx
│       │   │   ├── DIIDashboard.jsx / DIIWorkspace.jsx
│       │   │   ├── DEBMDashboard.jsx / DEBMWorkspace.jsx
│       │   │   ├── RTPDashboard.jsx / RTPWorkspace.jsx
│       │   │   ├── MentorDashboard.jsx
│       │   │   ├── CoordinatorDashboard.jsx
│       │   │   └── TechnicalCommitteeDashboard.jsx
│       │   ├── workspace/         # Role workspaces
│       │   │   ├── MentorWorkspace.jsx
│       │   │   ├── CoordinatorWorkspace.jsx
│       │   │   └── TechnicalCommitteeWorkspace.jsx
│       │   └── *.jsx              # Shared & public pages (Contact, Departments, WorkspacePortal, …)
│       ├── components/            # Reusable UI components
│       ├── context/
│       │   ├── AuthContext.jsx     # Authentication state
│       │   └── LanguageContext.jsx # Internationalisation
│       ├── services/
│       │   └── api.js             # Centralised Axios API client
│       ├── App.jsx                # Root component & routing
│       ├── firebase.js            # Firebase configuration
│       └── main.jsx               # Entry point
│
└── README.md
```



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

Or manually execute each SQL file in `migrations/` (001 through 014) against the database.

---

## Environment Variables

Create a `.env` file inside `CITT_Server/` with the following:

| Variable                         | Description                              | Example                  |
|----------------------------------|------------------------------------------|--------------------------|
| `DB_HOST`                        | PostgreSQL host                          | `localhost`              |
| `DB_PORT`                        | PostgreSQL port                          | `5432`                   |
| `DB_USER`                        | Database user                            | `citt_users`             |
| `DB_PASSWORD`                    | Database password                        | `your_password`          |
| `DB_NAME`                        | Database name                            | `citt_db`                |
| `PORT`                           | Server port                              | `5000`                   |
| `JWT_SECRET`                     | Secret key for signing JWT tokens        | A long random string     |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase service account JSON   | `./service-account.json` |

---

## User Roles & Permissions

The system has 11 roles arranged in a strict hierarchy (higher number = higher authority):

| Level | Role                        | Key Identifier               |
|-------|-----------------------------|------------------------------|
| 8     | Super Administrator         | `superAdmin`                 |
| 7     | Administrator               | `admin`                      |
| 6     | Transfer Technology Officer | `transferTechnologyOfficer`  |
| 5     | DII Director                | `diiDirector`                |
| 5     | DEBM Director               | `debmDirector`               |
| 5     | RTP Director                | `rtpDirector`                |
| 4     | IP Manager                  | `ipManager`                  |
| 3     | Mentor                      | `mentor`                     |
| 3     | Technical Committee         | `technicalCommittee`         |
| 2     | Coordinator                 | `coordinator`                |
| 1     | Innovator                   | `innovator`                  |

### Super Administrator (`superAdmin`)

Full system control. Can manage all users, assign any role, view audit logs, inspect database information, configure permissions, and access every feature available to lower roles.

### Administrator (`admin`)

Manages day-to-day operations. Can approve or reject project and funding submissions, manage users (without changing roles), upload gallery images, create and publish events, assign projects to mentors/coordinators/technical committees, and view analytics and audit logs.

### Transfer Technology Officer (`transferTechnologyOfficer`)

Oversees technology transfer workflows. Has admin-level access to project approvals and analytics with a focus on commercialisation pipeline management.

### Department Directors (`diiDirector`, `debmDirector`, `rtpDirector`)

Each director manages their respective department (DII, DEBM, RTP). Can review project submissions within their department, view department-specific dashboards and workspaces, manage complaints, training programmes, and business records.

### IP Manager (`ipManager`)

Handles intellectual property workflows. Can review and approve/reject IP submissions, view IP statistics and analytics, and manage IP records. Cannot manage users, funding, or events.

### Mentor (`mentor`)

Assigned to specific projects by administrators. Reviews and comments on project milestone stages, provides guidance to innovators through a dedicated workspace, and tracks assigned project progress.

### Technical Committee (`technicalCommittee`)

Reviews technical aspects of assigned projects. Provides feedback on milestone submissions and participates in the project evaluation process alongside mentors and coordinators.

### Coordinator (`coordinator`)

Coordinates project progress between innovators, mentors, and department directors. Tracks milestone completion and manages communication across stakeholders for assigned projects.

### Innovator (`innovator`)

The default role for registered users. Can submit projects (which progress through 9 milestone stages), apply for funding, register IP, participate in events, and manage their own profile and submissions.



## Departments

CITT comprises three operational departments, each with a dedicated director role and workspace:

### Department of Innovations and Incubation (DII)
Trains and mentors inventors, handles innovation complaints, coordinates technology transfer, and maintains a database of innovators and project progress.

### Department of Entrepreneurship and Business Management (DEBM)
Conducts entrepreneurship training, develops business plans, markets innovative products, provides financial advisory, and designs mechanisms to convert research outputs into commercial companies.

### Rural Technology Park (RTP)
Located at MUST Rukwa Campus College. Brings technology to rural communities, commercialises innovations for rural impact, supports spin-offs and start-ups, and acts as a driver of Public/Private Partnerships.



## Features

### Project Management with Milestone Tracking
Submit innovation and research projects with full lifecycle tracking through a 9-stage milestone system. Each stage can be submitted, reviewed, approved, or rejected independently. Administrators assign projects to mentors, technical committees, and coordinators. Milestone progress is tracked automatically via database triggers.

### Project Assignments
Administrators assign projects to specific reviewers (`mentor`, `technical_committee`, `coordinator`). Assignees receive notifications and gain workspace access to their projects. Assignments can be toggled active/inactive.

### Role-Based Dashboards & Workspaces
Every role has a tailored dashboard. Department directors (DII, DEBM, RTP) have department-specific workspaces. Mentors, coordinators, and technical committee members access dedicated workspaces showing only their assigned projects. A unified `WorkspacePortal` routes users to their appropriate workspace automatically.

### Funding Management
Apply for funding with detailed proposals including amounts and grant types. Administrators manage the approval pipeline with status tracking from application through disbursement to completion. Supports approved amount tracking.

### Intellectual Property Management
Register and manage IP records through a dedicated workflow. IP Managers review submissions and handle approvals. Includes statistics and analytics dashboards specific to IP operations.

### Department Management
Each CITT department (DII, DEBM, RTP) has a managed profile including director information, department functions, complaints handling, training programmes, and business records. Department activity is logged for accountability.

### Events System
Create and publish events of various types — hackathons, workshops, challenges, exhibitions, seminars, and conferences. Users submit entries with team details, descriptions, and file attachments. Administrators provide feedback and track submission statuses through review stages.

### Gallery
Public image gallery showcasing innovation events and activities. Administrators upload and manage images through a dedicated management interface. Accessible to all visitors without authentication.

### Notifications
Automatic notifications triggered by key actions — project approvals/rejections, funding decisions, IP application outcomes, event publications, and milestone updates. Users receive notifications via an in-app bell icon with polling support.

### Audit Logging
All significant actions are logged with user details, timestamps, IP addresses, and user agents. Super administrators and administrators can view, filter, and export audit logs as CSV or PDF.

### User Management
Registration via email/password or Google OAuth. Profile management with university, college, and year of study fields. Super administrators can create accounts for any role and change user roles. Soft-delete support preserves data integrity.



## API Reference

### Authentication — `/api/auth`

| Method | Endpoint                      | Access    | Description                    |
|--------|-------------------------------|-----------|--------------------------------|
| POST   | `/api/auth/register`          | Public    | Register with email & password |
| POST   | `/api/auth/firebase-register` | Public    | Register via Google OAuth      |
| POST   | `/api/auth/login`             | Public    | Login and receive JWT token    |
| POST   | `/api/auth/set-password`      | Protected | Set password (OAuth users)     |
| PUT    | `/api/auth/change-password`   | Protected | Change existing password       |
| GET    | `/api/auth/me`                | Protected | Get current user profile       |
| PUT    | `/api/auth/me`                | Protected | Update own profile             |

### Admin — `/api/admin`

| Method | Endpoint                            | Access  | Description                    |
|--------|-------------------------------------|---------|--------------------------------|
| GET    | `/api/admin/users`                  | Admin+  | List users with filters        |
| GET    | `/api/admin/projects`               | Admin+  | List project submissions       |
| PUT    | `/api/admin/projects/:id/approve`   | Admin+  | Approve a project              |
| PUT    | `/api/admin/projects/:id/reject`    | Admin+  | Reject a project               |
| POST   | `/api/admin/projects/:id/assign`    | Admin+  | Assign project to a reviewer   |
| GET    | `/api/admin/funding`                | Admin+  | List funding applications      |
| PUT    | `/api/admin/funding/:id/approve`    | Admin+  | Approve funding                |
| PUT    | `/api/admin/funding/:id/reject`     | Admin+  | Reject funding                 |

### Super Admin — `/api/superadmin`

| Method | Endpoint                          | Access     | Description                  |
|--------|-----------------------------------|------------|------------------------------|
| GET    | `/api/superadmin/system/stats`    | SuperAdmin | System-wide statistics       |
| GET    | `/api/superadmin/analytics`       | SuperAdmin | Detailed analytics           |
| GET    | `/api/superadmin/users`           | SuperAdmin | All users with role info     |
| POST   | `/api/superadmin/users`           | SuperAdmin | Create any-role account      |
| PUT    | `/api/superadmin/users/:id/role`  | SuperAdmin | Change user role             |
| GET    | `/api/superadmin/audit-logs`      | SuperAdmin | View audit logs              |
| GET    | `/api/superadmin/database/info`   | SuperAdmin | Database table information   |

### IP Manager — `/api/ipmanager`

| Method | Endpoint                                | Access      | Description               |
|--------|-----------------------------------------|-------------|---------------------------|
| GET    | `/api/ipmanager/dashboard`              | IP Manager+ | Dashboard statistics      |
| GET    | `/api/ipmanager/records`                | IP Manager+ | All IP records            |
| GET    | `/api/ipmanager/pending`                | IP Manager+ | Pending IP approvals      |
| PUT    | `/api/ipmanager/ip-records/:id/approve` | IP Manager+ | Approve IP record         |
| PUT    | `/api/ipmanager/ip-records/:id/reject`  | IP Manager+ | Reject IP record          |

### Events — `/api/events`

| Method | Endpoint                          | Access    | Description                  |
|--------|-----------------------------------|-----------|------------------------------|
| GET    | `/api/events`                     | Public    | List published events        |
| POST   | `/api/events`                     | Admin+    | Create event                 |
| PUT    | `/api/events/:id`                 | Admin+    | Update event                 |
| PUT    | `/api/events/:id/publish`         | Admin+    | Publish/unpublish event      |
| POST   | `/api/events/:id/submissions`     | Protected | Submit to an event           |
| GET    | `/api/events/:id/submissions`     | Admin+    | View event submissions       |

### Milestones — `/api/projects`

| Method | Endpoint                                       | Access      | Description                        |
|--------|------------------------------------------------|-------------|------------------------------------|
| GET    | `/api/projects/:id/milestones`                 | Protected   | Get milestone stages for a project |
| POST   | `/api/projects/:id/milestones/:stage/submit`   | Innovator+  | Submit a milestone stage           |
| PUT    | `/api/projects/:id/milestones/:stage/approve`  | Reviewer+   | Approve a milestone stage          |
| PUT    | `/api/projects/:id/milestones/:stage/reject`   | Reviewer+   | Reject a milestone stage           |
| POST   | `/api/projects/:id/milestones/:stage/comment`  | Reviewer+   | Add a comment on a milestone stage |

### Departments — `/api/departments`

| Method | Endpoint                              | Access    | Description                          |
|--------|---------------------------------------|-----------|--------------------------------------|
| GET    | `/api/departments`                    | Public    | List all departments                 |
| GET    | `/api/departments/:code`              | Public    | Get department details & functions   |
| GET    | `/api/departments/:code/complaints`   | Director+ | List complaints for a department     |
| POST   | `/api/departments/:code/complaints`   | Protected | Submit a complaint                   |
| GET    | `/api/departments/:code/training`     | Protected | List training programmes             |
| POST   | `/api/departments/:code/training`     | Director+ | Create a training programme          |

### Workspace — `/api/workspace`

| Method | Endpoint                                  | Access    | Description                          |
|--------|-------------------------------------------|-----------|--------------------------------------|
| GET    | `/api/workspace/assigned-projects`        | Reviewer+ | Projects assigned to the current user|
| GET    | `/api/workspace/projects/:id/milestones`  | Reviewer+ | Milestones for an assigned project   |
| POST   | `/api/workspace/projects/:id/feedback`    | Reviewer+ | Submit feedback on a project         |

### Analytics — `/api/analytics`

| Method | Endpoint                   | Access | Description                        |
|--------|----------------------------|--------|------------------------------------|
| GET    | `/api/analytics/dashboard` | Admin+ | Comprehensive dashboard statistics |

### Gallery — `/api/gallery`

| Method | Endpoint           | Access | Description         |
|--------|--------------------|--------|---------------------|
| GET    | `/api/gallery`     | Public | List gallery images |
| POST   | `/api/gallery`     | Admin+ | Upload image        |
| DELETE | `/api/gallery/:id` | Admin+ | Delete image        |

### Notifications — `/api/notifications`

| Method | Endpoint                           | Access    | Description              |
|--------|------------------------------------|-----------|--------------------------|
| GET    | `/api/notifications`               | Protected | Get user notifications   |
| PUT    | `/api/notifications/:id/read`      | Protected | Mark as read             |
| PUT    | `/api/notifications/mark-all-read` | Protected | Mark all as read         |
| DELETE | `/api/notifications/:id`           | Protected | Delete a notification    |

### Search — `/api/search`

| Method | Endpoint                     | Access    | Description                     |
|--------|------------------------------|-----------|---------------------------------|
| GET    | `/api/search?keyword=<term>` | Protected | Search across events and users  |

---

## Database Schema

The system uses 14 migration files that create and maintain the following tables:

| Table                    | Purpose                                              |
|--------------------------|------------------------------------------------------|
| `users`                  | User accounts, roles, and profile data               |
| `projects`               | Innovation and research project submissions          |
| `project_milestones`     | 9-stage milestone tracking per project               |
| `project_assignments`    | Reviewer assignments (mentor, TC, coordinator)       |
| `milestone_comments`     | Reviewer feedback on individual milestone stages     |
| `funding`                | Funding applications and approval tracking           |
| `ip_management`          | Intellectual property records                        |
| `events`                 | Events (hackathons, workshops, etc.)                 |
| `event_submissions`      | User submissions to events                           |
| `submission_files`       | Files attached to event submissions                  |
| `submission_feedback`    | Reviewer feedback on event submissions               |
| `notifications`          | In-app user notifications                            |
| `gallery_images`         | Uploaded gallery images                              |
| `audit_logs`             | System activity audit trail                          |
| `departments`            | DII, DEBM, and RTP department records                |
| `department_functions`   | Listed functions/responsibilities per department     |
| `department_activity`    | Logged activity within each department               |
| `department_complaints`  | Complaints submitted to a department                 |
| `training_programmes`    | Training events managed by each department           |
| `business_records`       | DEBM business records linked to projects             |
| `director_profiles`      | Director name, photo, and bio per department         |
| `assignment_notifications` | Log of project assignment notification events      |

All user-facing tables support soft deletes via a `deleted_at` timestamp column.



## Authentication

The system uses a dual authentication approach:

**JWT (Primary)** — Users log in with email and password. The server returns a signed JWT token valid for 24 hours. All protected API requests include this token in the `Authorization: Bearer <token>` header. The middleware verifies the token and fetches fresh user data from the database on each request, ensuring role changes take effect immediately.

**Firebase OAuth (Secondary)** — Users can sign in with Google via Firebase. On first sign-in, the system creates a local user record linked by Firebase UID. Users authenticated via OAuth can optionally set a local password for direct login.



## Security

- **Password Hashing** — bcrypt with 10 salt rounds
- **Token Expiration** — JWT tokens expire after 24 hours
- **Parameterised Queries** — All database queries use parameterised inputs to prevent SQL injection
- **Role Enforcement** — Middleware-level role checks on every protected endpoint; role hierarchy prevents privilege escalation
- **Soft Deletes** — User data is logically deleted, preserving referential integrity
- **Audit Trail** — All significant actions logged with user, timestamp, IP address, and user agent
- **CORS** — Configured to allow only the frontend origin



Built for the Centre for Innovation and Technology Transfer (CITT) at Mbeya University of Science and Technology.
