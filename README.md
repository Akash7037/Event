# Intra-College Startup Pitching Competition Web Application

Organized by the **Entrepreneurship Development Cell (E-Cell)**.

A full-stack, production-ready web application featuring a **Student Portal** (registration, PPT template download, application status check) and a JWT-secured **Admin Portal** (statistics dashboard, filters, Eureka registration screenshot verification, and approval/rejection with email notifications).

---

## 🌟 Key Features

### 🎓 Student Portal (`index.html`)
- **Eureka Pre-Registration Mandate Alert**: Dynamic highlighted card instructing students to register for Eureka first using NEC ID `NEC2621509` under "Where did you find about us?". Includes 1-click copy functionality.
- **Team & Member Management**: Supports 1 to 3 team members (Leader mandatory; Member 2 & Member 3 optional with dynamic add/remove forms).
- **Eligibility Validation**: Enforces 2nd Year & 3rd Year eligibility restriction.
- **Startup Details**: Innovation Domain dropdown (`AI`, `Healthcare`, `Agriculture`, `Cybersecurity`, `Education`, `IoT`, `Robotics`, `FinTech`, `Others`), Problem Statement, and Abstract with real-time **300-word limit counter**.
- **Multer File Uploads**:
  - Presentation PPT (`.ppt`, `.pptx`, max 20MB).
  - Eureka Registration Screenshot (`.png`, `.jpg`, `.jpeg`, `.pdf`, max 10MB).
- **Originality Declaration**: Required confirmation checkbox.
- **Duplicate Prevention**: Rejects duplicate registrations using Leader Register Number.
- **Status Tracking**: Instant status lookup using Leader Email or Register Number.
- **PPT Template Download**: Direct sample pitch deck template download.

### 🛡️ Admin Portal (`admin.html`)
- **JWT Authentication**: Secure login with bcrypt hashed credentials.
- **Real-Time Statistics Dashboard**: Counters for Total Registrations, Pending Approval, Approved Teams, and Rejected Teams.
- **Filtering & Search**: Filter registrations by Search (Team Name, Leader Name, Reg No), Status, Department, and Year.
- **Verification Details Modal**: View complete team details, problem statement, abstract, PPT download link, and Eureka screenshot proof.
- **Approval & Rejection System**:
  - **Approve**: Updates team status to `Approved` and triggers automated confirmation email.
  - **Reject**: Popup modal to specify exact rejection reason, updates status to `Rejected`, and emails reason to team leader.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI.

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment (`.env`)**:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/pitch_competition
   JWT_SECRET=ecell_pitch_comp_secret_key_2026_secure
   JWT_EXPIRE=24h

   # Optional SMTP Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

3. **Start Server**:
   ```bash
   npm start
   ```

4. **Access the Portals**:
   - **Student Portal**: [http://localhost:5000](http://localhost:5000)
   - **Admin Portal**: [http://localhost:5000/admin](http://localhost:5000/admin)

---

## 🔑 Default Admin Credentials

Upon server startup, a default admin account is automatically created if one does not exist:

- **Username / Email**: `admin@ecell.edu` (or `admin`)
- **Password**: `admin123`

---

## 📁 Project Architecture

```
d:\EVent\
├── client/
│   ├── index.html                  # Student Portal (Registration & Status Check)
│   ├── admin.html                  # Admin Portal (Stats Dashboard & Verification)
│   ├── css/
│   │   └── style.css               # Glassmorphism UI design system & responsive layout
│   ├── js/
│   │   ├── app.js                  # Student portal client logic & drag-and-drop
│   │   └── admin.js                # Admin dashboard client logic & JWT management
│   └── assets/
│       └── Startup_Pitch_Template.pptx  # Pitch deck template asset
├── config/
│   └── db.js                       # Mongoose MongoDB connection setup
├── models/
│   ├── Team.js                     # Schema for Team, Leader, Members, Pitch, Status
│   └── Admin.js                    # Schema for Admin credentials & bcrypt hashing
├── middleware/
│   ├── authMiddleware.js           # JWT protection for Admin endpoints
│   ├── uploadMiddleware.js         # Multer configuration for PPT & Screenshots
│   └── errorMiddleware.js          # Global error handler with automatic file cleanup
├── controllers/
│   ├── teamController.js           # Student registration, status query, template
│   └── adminController.js          # Admin login, statistics, list, approve, reject
├── routes/
│   ├── teamRoutes.js               # Public API routes for teams
│   └── adminRoutes.js              # Protected API routes for admin
├── utils/
│   └── sendEmail.js                # Nodemailer helper with console mock fallback
├── uploads/
│   ├── ppt/                        # Uploaded presentation decks
│   └── screenshots/                # Uploaded Eureka registration screenshots
├── server.js                       # Main Express application entry point
├── seedAdmin.js                    # Script to seed default admin user
└── package.json                    # Dependencies & scripts
```
