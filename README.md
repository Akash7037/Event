# 🚀 Intra-College Startup Pitching Competition Web Application

Organized by the **Entrepreneurship Development Cell (E-Cell)**.

A full-stack, enterprise-grade web application featuring a **Student Portal** (team registration, Eureka referral verification, pitch deck template download, status check) and a JWT-secured **Admin Portal** (statistics dashboard, verification modal, QR-code entry scanner, CSV exporter, registration toggle, and automated email notifications).

---

## 🌟 Key Features

### 🎓 Student Portal (`index.html`)
* **Eureka Pre-Registration Mandate Alert**: Highlighted step-by-step card instructing students to register for the Eureka Competition using NEC ID `NEC2621509` under *"Where did you find about us?"*. Includes 1-click code copying.
* **Flexible Team Management**: Supports **1 to 3 members** per team (1 mandatory Team Leader + up to 2 optional members with dynamic add/remove forms).
* **Eligibility & Word Count Constraints**: Enforces **2nd Year & 3rd Year** student eligibility filter and a **300-word limit** for the pitch abstract.
* **Dual-Mode File Upload Engine**:
  * **Presentation Pitch Deck**: `.ppt`, `.pptx` (Max **10 MB**).
  * **Eureka Proof Screenshot**: `.png`, `.jpg`, `.jpeg`, `.pdf` (Max **5 MB**).
  * **Cloudinary CDN Integration**: Uploaded files stream directly to **Cloudinary Cloud Storage** with automatic fallback to local disk storage (`/uploads`).
* **Originality & Duplicate Checks**: Requires mandatory originality confirmation and rejects duplicate registrations based on Leader Register Number.
* **Application Status Tracker**: Instant status lookup by Leader Email or Register Number.
* **PPT Template Download**: Direct sample pitch deck template download link.

### 🛡️ Admin Portal (`admin.html`)
* **JWT Authentication & Passwords**: Secure login with bcrypt hashed credentials and profile credential update system.
* **Real-Time Statistics Dashboard**: Instant counters for *Total Registrations*, *Pending Verification*, *Approved Teams*, *Rejected Teams*, and *Checked-In Attendees*.
* **Live Auditorium QR Ticket Scanner**: Integrated camera QR Scanner & manual ticket ID verifier for instant event check-in at the auditorium door. Prevents duplicate entry scans.
* **Filtering & Search System**: Search by Team Name, Leader Name, Register Number, or Email, with filters for Status, Department, and Academic Year.
* **Verification Modal**: Inspect full team details, innovation domain, problem statement, abstract, PPT download link, and proof screenshot.
* **Approval & Rejection Workflow**:
  * **Approve**: Marks status as `Approved` and dispatches an official **Approval Email containing an Embedded High-Res Entry QR Pass**.
  * **Reject**: Opens a reason modal, marks status as `Rejected`, and emails the detailed rejection reason to the team leader.
* **Dynamic Registration Control**: Global toggle to open or close competition registrations in real time.
* **CSV Export & Backup Dispatcher**: Export all registration records to `.csv` or trigger bulk backup emails to event organizers.

---

## 🏗️ Architecture & Resilience

* **Zero-Downtime Database Fallback**: Connected to **MongoDB Atlas**. If MongoDB connection is interrupted or DNS fails, the server gracefully activates a fast **in-memory data store** (`inMemoryTeams`), ensuring zero-delay registration during peak traffic.
* **Multi-Provider Email Engine**: Supports **Brevo API**, **Resend**, **SendGrid**, and standard **SMTP (Nodemailer)** with automatic failover.

---

## ⚡ Tech Stack

* **Backend**: Node.js, Express.js, Mongoose (MongoDB ORM), Multer, JWT, BcryptJS, Cloudinary SDK, QRCode
* **Frontend**: Vanilla HTML5, Modern CSS3 (Glassmorphic Design System, Light/Dark theme switch), JavaScript (ES6+), FontAwesome Icons
* **Cloud Storage**: Cloudinary CDN (25 GB Free Tier) with local disk fallback

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v16.0.0 or higher)
* MongoDB (Local instance or MongoDB Atlas cluster)
* Cloudinary Account (Free - No Credit Card required)

### 1. Installation

```bash
# Clone the repository
cd EVent

# Install dependencies
npm install
```

### 2. Environment Configuration (`.env`)

Create or update the `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/pitch_competition?retryWrites=true&w=majority
JWT_SECRET=ecell_pitch_comp_secret_key_2026_secure
JWT_EXPIRE=24h

# Email Engine Configuration ('brevo' | 'resend' | 'sendgrid' | 'smtp')
EMAIL_SERVICE=brevo
BREVO_API_KEY=your_brevo_api_key_here

# SMTP Configuration (Optional Fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME="E-Cell Startup Competition"

# Cloudinary Cloud Object Storage Configuration (25GB Free Tier)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Start the Server

```bash
# Start production server
npm start

# Or start development server with Nodemon
npm run dev
```

### 4. Access Portals

* 🎓 **Student Portal**: [http://localhost:5000](http://localhost:5000)
* 🔐 **Admin Portal**: [http://localhost:5000/admin](http://localhost:5000/admin)

---

## 🔑 Default Admin Credentials

Upon server startup, a default admin account is automatically seeded if none exists:

* **Username**: `admin` *(or `admin@ecell.edu`)*
* **Password**: `admin123`

---

## 📡 API Endpoints Summary

### Public Student Endpoints (`/api/teams`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/teams/register` | Submit team registration with PPT & Eureka proof upload |
| `GET` | `/api/teams/status` | Check submission status by Email or Register Number |
| `GET` | `/api/teams/template` | Download official Pitch Deck PPT Template |

### Admin Endpoints (`/api/admin` - Requires JWT Header `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Authenticate admin & receive JWT token |
| `GET` | `/api/admin/stats` | Fetch real-time dashboard statistics |
| `GET` | `/api/admin/teams` | Get teams with search, department, year & status filters |
| `GET` | `/api/admin/teams/:id` | Get full verification details for a single team |
| `PATCH` | `/api/admin/teams/:id/approve` | Approve team & email entry QR Pass |
| `PATCH` | `/api/admin/teams/:id/reject` | Reject team with reason & notify leader via email |
| `POST` | `/api/admin/verify-ticket` | Verify QR Ticket scan for auditorium check-in |
| `GET` | `/api/admin/export-csv` | Export all team registrations as `.csv` file |
| `GET` | `/api/admin/registration-status` | Get global registration open/closed status |
| `POST` | `/api/admin/toggle-registration` | Open or close competition registration dynamically |

---

## 📁 Project Architecture

```
EVent/
├── client/
│   ├── index.html                  # Student Portal (Registration, Eureka Guide & Status Tracker)
│   ├── admin.html                  # Admin Portal (Dashboard, Filtering, Verification & QR Scanner)
│   ├── css/
│   │   └── style.css               # Glassmorphic UI theme system (Light & Dark Mode)
│   ├── js/
│   │   ├── app.js                  # Student portal client logic & drag-and-drop file handler
│   │   └── admin.js                # Admin dashboard logic, JWT storage & QR scanner camera
│   └── assets/
│       └── Startup_Pitch_Template.pptx  # Pitch deck template asset
├── config/
│   └── db.js                       # Mongoose connection setup with in-memory fallback
├── models/
│   ├── Team.js                     # Schema for Teams, Members, Pitch, Status & QR Check-in
│   └── Admin.js                    # Schema for Admin credentials & Bcrypt password hashing
├── middleware/
│   ├── authMiddleware.js           # JWT protection middleware for Admin endpoints
│   ├── uploadMiddleware.js         # Multer & Cloudinary cloud storage upload middleware
│   └── errorMiddleware.js          # Global error handler with auto temp-file cleanup
├── controllers/
│   ├── teamController.js           # Student registration handler & status query controller
│   └── adminController.js          # Admin dashboard, stats, approval/rejection & QR ticket verifier
├── routes/
│   ├── teamRoutes.js               # Public API routes for student portal
│   └── adminRoutes.js              # Protected API routes for admin dashboard
├── utils/
│   └── sendEmail.js                # Multi-provider email engine (Brevo, Resend, SendGrid, SMTP)
├── uploads/                        # Local file storage fallback directory
│   ├── ppt/
│   └── screenshots/
├── server.js                       # Express app entry point & keep-alive ping setup
├── seedAdmin.js                    # Default admin account seeder
├── package.json                    # Project dependencies & scripts
└── README.md                       # Comprehensive documentation
```

---

## 🛡️ License

Organized and managed by **Entrepreneurship Development Cell (E-Cell)**. All Rights Reserved 2026.
