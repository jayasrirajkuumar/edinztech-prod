# Local Application Documentation (EdinzTech LMS)

This document describes the existing architecture and behavior of the EdinzTech LMS application as it runs in the **current local environment**.

---

## 1. Application Overview (Local Context)

**What is it?**
EdinzTech LMS is a Learning Management System (LMS) designed to manage educational programs, enroll students, track progress, and issue certificates. It consists of a web interface (Frontend) and a server API (Backend).

**What is it used for?** 

- Creating and managing courses, internships, and workshops.
- Enrolling students into these programs.
- Delivering automated emails (Welcome, Offer Letters).
- Generating and verifying PDF certificates.
- Conducting online quizzes and collecting feedback.

**Who uses it?**
1.  **SysAdmin/Admin**: Manages the platform, creates programs, invites students, and processes certificates.
2.  **Student**: Logs in to view their enrolled programs, take quizzes, and download their certificates.

**Local Execution Perspective:**
The application runs as two separate processes on the local machine:
1.  **React Frontend**: Runs on `localhost:5173` (Vite).
2.  **Node.js Backend**: Runs on `localhost:5000` (Express).
Data is stored in a local MongoDB database constantly running on the machine.

---

## 2. Local Architecture Overview

### Frontend Structure (Local)
- **Framework**: React.js (Vite).
- **Styling**: TailwindCSS.
- **Communication**: Uses `Axios` to call the Backend API at `http://localhost:5000/api`.
- **Pages**: Divided into Public (Landing), Student Dashboard, and Admin Dashboard.

### Backend Structure (Local)
- **Framework**: Node.js with Express.js.
- **Database**: Connects to `mongodb://localhost:27017/edinztech` (or similar URI in `.env`).
- **API Style**: RESTful API returning JSON.
- **Authentication**: JWT (JSON Web Tokens) passed in Authorization headers.

### Certificate Service (Local)
Certificate generation acts as an internal service (or microservice pattern run locally):
1.  Admin clicks "Publish".
2.  Backend generates a Unique ID (e.g., `CERT-PROG-2024-123456`).
3.  Backend calls a local endpoint (defined by `CERT_SERVICE_URL`) to generate the PDF.
4.  The service (or internal logic) creates the PDF and returns success.

### Email Handling (Local)
- Emails are sent using `Nodemailer`.
- It connects to an SMTP server defined in `.env`.
- If credentials are missing or invalid, it may log "Mock credentials detected" and skip sending (Fail-soft).

### MongoDB Local Instance Usage
- The application assumes a MongoDB instance is running locally on port `27017`.
- It creates a database named `assuvar` (or as specified in connection string).
- Models define the schema for data consistency.

---

## 3. Local Environment Setup

**Running the Application:**
1.  **Backend**: `npm run dev` in the `server/` directory. (Starts Nodemon on port 5000).
2.  **Frontend**: `npm run dev` in the root directory. (Starts Vite on port 5173).

**Environment Variables (`.env` in `server/`):**
The application reads these keys at startup:
- `PORT`: The port the server listens on (Default: 5000).
- `MONGO_URI`: Connection string for the local MongoDB (e.g., `mongodb://localhost:27017/assuvar`).
- `JWT_SECRET`: Secret key for signing login tokens.
- `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASS`: SMTP credentials for sending emails.
- `FRONTEND_URL`: URL to link in emails (e.g., `http://localhost:5173`).
- `CERT_SERVICE_URL`: Endpoint for certificate generation.

**Service Bindings:**
- Backend binds to `0.0.0.0` or `localhost`.
- Frontend proxies requests or calls backend directly via CORS.

---

## 4. Project Folder Structure

### Root Folder
- **`src/`**: Contains the React Frontend source code.
- **`server/`**: Contains the Node.js Backend source code.
- **`public/`**: Static assets for the frontend.
- **`package.json`**: Dependencies for the frontend.

### `server/` Folder
- **`config/`**: Database connection logic.
- **`controllers/`**: Business logic (functions) for each route.
- **`models/`**: Mongoose schemas defining database structure.
- **`routes/`**: API endpoint definitions mapping URLs to controllers.
- **`middlewares/`**: Logic receiving requests before controllers (Auth, Uploads).
- **`services/`**: Helper logic (Email, Third-party integrations).
- **`events/`**: Event listeners for async actions (like triggering emails after invites).
- **`uploads/`**: Local storage for uploaded files (images, templates).

### `src/` Folder
- **`api/`** or **`lib/`**: Axios configuration and API helper functions.
- **`components/`**: Reusable UI elements (Buttons, Forms, Tables).
- **`pages/`**: Full page components (Dashboard, Login, Home).
- **`assets/`**: Images and icons.

---

## 5. File-by-File Breakdown

### Server (`server/`)

#### Configuration & Entry
- **`server.js`**: The HTTP entry point. Loads `.env`, imports `app.js`, and starts `app.listen`.
- **`app.js`**: The Express application setup. Mounts middleware (CORS, JSON), mounts Routes, and connects to DB.
- **`config/db.js`**: Logic to connect Mongoose to the local MongoDB instance.

#### Models (`server/models/`)
- **`User.js`**: Schema for Users (Students/Admins). Stores email, password hash, role, and profile data.
- **`Program.js`**: Schema for Courses/Internships. Stores title, dates, template paths, and config.
- **`Enrollment.js`**: Schema linking a `User` to a `Program`. Stores status (`active`), payment info, and **Certificate Status**.
- **`Certificate.js`**: Schema for issued certificates. Stores the Unique `certificateId`, `qrCode`, and verification status.
- **`Payment.js`**: Schema for payment records (Razorpay IDs).
- **`Quiz.js`**: Schema for internal quizzes (Questions, Marks).
- **`OutsiderQuiz.js`**: Schema for public/outsider quizzes.
- **`AccessLog.js`**: Audit log for sensitive actions (like Admin viewing student credentials).
- **`FeedbackResponse.js`**: Stores student feedback submissions.

#### Controllers (`server/controllers/`)
- **`authController.js`**: Handles Login (`/login`), Admin Login, and Forgot Password logic.
- **`adminController.js`**: Admin dashboard logic. Inviting students (`inviteStudent`), fetching enrollments (`getEnrollments`), and stats.
- **`certificateController.js`**: Logic to **Publish** certificates/offer letters, **Regenerate**, and **Verify** them.
- **`programController.js`**: CRUD operations for Programs (Create, Update, Delete).
- **`paymentController.js`**: Handles Razorpay order creation and verification webhook.
- **`quizController.js`**: Logic for serving quiz questions and grading attempts.
- **`outsiderQuizController.js`**: Logic for public quizzes (no login required).
- **`feedbackController.js`**: Handles feedback submission.

#### Routes (`server/routes/`)
- **`authRoutes.js`**: Maps `/api/auth` to `authController`.
- **`programRoutes.js`**: Maps `/api/programs` to `programController`.
- **`certificateRoutes.js`**: Maps `/api/certificates` to `certificateController`.
- **`adminRoutes.js`**: Maps `/api/admin` to `adminController` (Invites).
- **`paymentRoutes.js`**: Maps `/api/payments`.

#### Services (`server/services/`)
- **`emailService.js`**: Wrapper around Nodemailer to send HTML emails.
- **`enrollmentService.js`**: Helper functions for enrolling users.
- **`certificateService.js`** (or logic in controller): Interaction with PDF generation.

### Frontend (`src/`)

#### Core
- **`main.jsx`**: React entry point. Mounts the App to DOM.
- **`App.jsx`**: Main Routes definition. Handles navigation structure.
- **`lib/api.js`**: Central Axiso instance. Intercepts requests to add Authorization token.

#### Components
- **`components/forms/InviteForm.jsx`**: Form for Admin to invite students.
- **`components/ui/*`**: Reusable UI components (Input, Button, Card).

#### Pages
- **`pages/Login.jsx`**: Student login page.
- **`pages/AdminLogin.jsx`**: Admin login page.
- **`pages/Dashboard.jsx`**: Student Dashboard (My Courses, Certificates).
- **`pages/admin/AdminDashboard.jsx`**: Admin Dashboard (Stats).
- **`pages/admin/invite.jsx`**: Page to invite users.
- **`pages/Verify.jsx`**: Public page to verify certificate IDs.

---

## 6. MongoDB Local Database Design

**Database Name**: By default `edinztech` or `assuvar`.

### Collections

1.  **users** (`User` model)
    *   **Purpose**: Stores all accounts.
    *   **Fields**: `email` (Unique), `password` (Hashed), `role` ('student'/'admin'), `userCode` (Unique ID).
    *   **Indexes**: `email` is indexed for fast login lookup.

2.  **programs** (`Program` model)
    *   **Purpose**: Stores definitions of things students can enroll in.
    *   **Fields**: `title`, `type` (Course/Internship), `startDate`, `endDate`, `certificateTemplate` (path).

3.  **enrollments** (`Enrollment` model)
    *   **Purpose**: The **Core Join Table** linking Users to Programs.
    *   **Source of Truth**: This collection determines if a student gets a certificate.
    *   **Fields**: `user` (Ref), `program` (Ref), `status`, `certificateStatus` ('PUBLISHED'/'NOT_PUBLISHED'), `certificateId`, `offerLetterStatus`.
    *   **Constraint**: Unique compound index on `[user, program]` prevents duplicate enrollment.

4.  **certificates** (`Certificate` model)
    *   **Purpose**: A dedicated record for issued certificates (Audit & Fast Verification).
    *   **Fields**: `certificateId` (Unique String), `qrCode` (Base64), `verification.status` ('valid').
    *   **Relationship**: Linked to `User` and `Program`.

5.  **payments** (`Payment` model)
    *   **Purpose**: Records financial transactions.
    *   **Fields**: `razorpayPaymentId`, `amount`, `status`.

---

## 7. User Identity Logic (Local)

-   **Creation**:
    -   **Sign Up**: There is NO public signup page. Accounts are created ONLY via:
        1.  **Purchase**: Choosing a course and paying (Account created automatically if new).
        2.  **Invite**: Admin manually enters email in "Invite Student" form.
-   **ID Generation**: MongoDB `_id` is the internal primary key. `userCode` is a human-readable string generated by logic in `User.js`/Controller.
-   **Roles**: Defined by the `role` string field. 'admin' gets access to `/admin` routes. 'student' gets access to `/dashboard`.

---

## 8. Authentication & Authorization (Local)

-   **Login Flow**:
    1.  User posts Email/Password to `/api/auth/login`.
    2.  Server finds User, hashes input password with `bcrypt`, calls `compare`.
    3.  If Match: Server signs a **JWT** (JSON Web Token) containing `id` and `role`.
    4.  Server returns JWT.
    5.  Frontend saves JWT in `localStorage`.
-   **Authorization**:
    -   Frontend checks `localStorage` token.
    -   Backend routes use middleware `protect`:
        1.  Extracts token from `Authorization: Bearer <token>` header.
        2.  Verifies signature using `JWT_SECRET`.
        3.  Attaches `req.user` to the request object.
    -   Admin routes use middleware `admin`: Checks if `req.user.role === 'admin'`.

---

## 9. Certificate & Offer Letter System (Local)

### Certificate Generation Flow
1.  **Trigger**: Admin selects a Program -> "Publish Certificates".
2.  **Selection**: Server finds all `Enrollment` docs for that program (Active/Completed).
3.  **ID Generation**: If no ID exists, generating format `CERT-<PROG>-<YEAR>-<RANDOM>`.
4.  **Generation**: Server calls local service (Axios POST) with Student Data + Template Path. Service returns success (and likely stores/serves the PDF).
5.  **Storage**:
    -   Updates `Enrollment`: Sets `certificateId`, `certificateStatus` = 'PUBLISHED'.
    -   Upserts `Certificate` Doc: Creates a searchable record for verification.

### Offer Letter Generation
-   **Trigger**: Admin selects Program -> "Publish Offer Letters".
-   **ID Format**: `OFFER-<PROG>-<USER_ID_SUFFIX>-<TIMESTAMP>`.
-   **Logic**: Similar to certificates. Updates `enrollment.offerLetterStatus`.

### Verification (Local)
-   **Endpoint**: `/verify?certificateId=XXX` or `Scanner`.
-   **Logic**: API checks `Enrollment` collection first. If a match is found with that `certificateId`, it returns "VALID" and details. This ensures truth comes from enrollment.

---

## 10. Student Lifecycle Flow (Local)

**Non-Technical Explanation:**
1.  **Registration**: A student pays for a course OR is invited by an admin by email. An account is created instantly.
2.  **Notification**: The student receives an email with a link to login (and password if invited).
3.  **Access**: Student logs in. They see their course on the Dashboard.
4.  **Learning**: Student watches content (if available) or attends sessions.
5.  **Completion**: Admin marks the course completed or the student passes a quiz.
6.  **Certification**: Admin clicks "Publish". The student sees a "Download Certificate" button on their dashboard.

**Technical Explanation:**
1.  **Invite**: `POST /api/admin/invite` -> `User.create` -> `Enrollment.create(source='invite')` -> `sendEmail`.
2.  **Login**: `POST /api/auth/login` -> JWT Token -> Client stores Token.
3.  **Dashboard**: `GET /api/me/enrollments` -> Returns list joined with Program data.
4.  **Certificate**: Backend updates `Enrollment.certificateStatus`. Client sees status 'PUBLISHED' and renders Download button.

---

## 11. Email System (Local)

-   **Trigger**: Code calls `sendEmail({ to, subject, html })`.
-   **Configuration**: Uses `nodemailer`. Transporter created using `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` env vars.
-   **Types**:
    -   **Welcome/Invite**: "You have been added to..." + Credentials.
    -   **Credentials Recovery**: "Here is your password...".
    -   **Certificate Notification**: (Optional depending on config).
-   **Failure**: If local internet blocks SMTP or creds are wrong, the `catch` block logs the error but does **NOT** crash the server. The user creation/enrollment still succeeds (labeled "Soft Fail").

---

## 12. Error Handling (Local Behavior)

-   **Code Level**: Most controllers use `express-async-handler`. Any error thrown inside is caught by Express.
-   **Global Handler**: `server/app.js` has a middleware at the end. It catches errors and sends a JSON response: `{ message: err.message, stack: ... }`.
-   **Service Failure**: If the Certificate Generation service is down, the axios call fails. The server catches this, logs "Failed to publish for [user]", and adds it to a generic `errors` list returned to the Admin frontend. The process continues for other students.

---

## 13. Data Consistency & Integrity (Local)

-   **Duplicate Users**: `User` model enforces `unique: true` on `email`. Creating a user with an existing email throws a MongoDB error (E11000).
-   **Duplicate Enrollments**: `Enrollment` model has a compound unique index on `{ user: 1, program: 1 }`. A user cannot enroll in the same program twice.
-   **Certificate ID**: `Enrollment.certificateId` and `Certificate.certificateId` are unique indices. This prevents two people from having the exact same Certificate ID string.

---

## 14. Known Limitations (Local Only)

1.  **Email Reliability**: Local ISPs often block SMTP ports (25/465/587). Emails might fail silently or timeout if not using a specific relay.
2.  **File Storage**: Uploads (images/templates) are stored in `server/uploads` text folder. If the folder is deleted, data is lost.
3.  **No Background Jobs**: Certificate generation happens *synchronously* in the request loop. If processing 1000 students, the request might timeout (Browser limits 2 mins). There is no queue system locally.
4.  **Memory State**: Some stats are calculated in-memory (Javascript arrays) inside `getDashboardStats`, which might be slow for large datasets.

---

## 15. Glossary

-   **Model/Schema**: A blueprint defining what data (fields) must be saved for a user, course, etc.
-   **Controller**: The "Brain" function that decides what to do when a specific URL is visited.
-   **Middleware**: Security guards that check if you are allowed (logged in) before letting you see the Controller.
-   **JWT (Token)**: A digital passcard given after login. The Frontend must show this card with every request to prove identity.
-   **Populate**: A MongoDB term for "Joining" tables. e.g., "Give me the Enrollment, but also fetch the Name from the User table related to it."

---

## 16. Application Logic & Constraints

### 16.1. Application Flow Diagram

This diagram visualizes the high-level architecture, request flow, and separation between Public, Private (Student), and Admin zones.

```mermaid
graph TD
    User((User/Browser))
    
    subgraph "Frontend (React - Port 5173)"
        PublicPages[Public Pages<br/>(Home, About, Contact)]
        AuthPages[Auth Pages<br/>(Login, Admin Login)]
        StudentDash[Student Dashboard<br/>(Protected: /dashboard)]
        AdminDash[Admin Dashboard<br/>(Protected: /admin)]
    end

    subgraph "Backend (Express API - Port 5000)"
        AuthMiddleware{Auth Middleware<br/>(Verify JWT)}
        AdminMiddleware{Admin Check<br/>(Role == 'admin')}
        
        API_Auth[Auth Controller]
        API_Public[Public APIs<br/>(Programs, Contact)]
        API_Private[Private APIs<br/>(Enrollments, My Profile)]
        API_Admin[Admin APIs<br/>(Publish Certs, Manage Programs)]
    end

    subgraph "Database (MongoDB)"
        Users[(Users)]
        Programs[(Programs)]
        Enrollments[(Enrollments)]
        Certificates[(Certificates)]
    end

    %% Flows
    User -->|Visits| PublicPages
    User -->|Login| AuthPages
    
    AuthPages -->|POST /api/auth/login| API_Auth
    API_Auth -->|Verify| Users
    API_Auth -->|Return JWT| AuthPages

    User -->|With JWT| StudentDash
    StudentDash -->|Request + Token| AuthMiddleware
    AuthMiddleware -->|Valid| API_Private
    API_Private -->|Read/Write| Enrollments

    User -->|With Admin JWT| AdminDash
    AdminDash -->|Request + Token| AuthMiddleware
    AuthMiddleware -->|Valid| AdminMiddleware
    AdminMiddleware -->|Authorized| API_Admin
    API_Admin -->|Read/Write| Programs
    API_Admin -->|Publish| Certificates

    %% Public Interaction
    PublicPages -->|GET /programs| API_Public
    API_Public -->|Read| Programs
```

### 16.2. Unique ID Generation Logic

The application uses specific formats for generating unique identifiers for Certificates and Offer Letters to ensure they are human-readable and trackable.

| Entity | ID Format | Example | Logic Location |
| :--- | :--- | :--- | :--- |
| **Standard Certificate** | `CERT-<CODE>-<YYYY>-<RANDOM>` | `CERT-FSD-2024-123456` | `certificateController.js` (publishCertificates) |
| **New Issue Certificate** | `EDZ-CERT-<YYYY>-<USER_LAST4><RANDOM4>` | `EDZ-CERT-2024-a1b29988` | `certificateController.js` (issueCertificate) |
| **Offer Letter** | `OFFER-<CODE>-<USER_LAST4>-<TIME_LAST4>` | `OFFER-FSD-a1b2-1234` | `certificateController.js` (publishOfferLetters) |
| **Project Acceptance** | `ACCEPT-<CODE>-<USER_LAST4>-<TIME_LAST4>` | `ACCEPT-PROJ-a1b2-5678` | `certificateController.js` (publishOfferLetters) |
| **User ID** | MongoDB ObjectId (Hex String) | `60d5ec...` | Native MongoDB |
| **User Code** | `USR-<RANDOM>` (Optional) | `USR-8821` | `User.js` (Schema) |

**Logic Notes:**
*   **Random Suffix**: Used to ensure uniqueness even if generated at the same second.
*   **Code**: Derived from `Program.code` (e.g., FSD for Full Stack).
*   **Collision Handling**: `Enrollment.certificateId` has a `unique` index in database, preventing duplicates at the DB level.

### 16.3. Mandatory Fields & Constraints

Strict validation ensures data integrity.

#### 16.3.1. Frontend Forms (Client-Side)

*   **Contact Form** (`ContactSection.jsx`):
    *   **Full Name**: Required (Text).
    *   **Email**: Required (Valid Email Format).
    *   **Message**: Required (Text Area).
    *   *Note: Currently uses HTML5 `required` attribute and implicitly validated via `input type="email"`.*

*   **Login Form**:
    *   **Email**: Required.
    *   **Password**: Required.

#### 16.3.2. Database Models (Server-Side)

These are enforced by Mongoose Schemas. If these are missing, the API will return a 500/400 Error.

**User Model (`User.js`)**
-   `name`: **Mandatory**
-   `email`: **Mandatory** & **Unique**
-   `password`: **Mandatory**
-   `isAdmin`: **Mandatory** (Default: false)

**Program Model (`Program.js`)**
-   `title`: **Mandatory**
-   `code`: **Unique** (Sparse)
-   `type`: **Mandatory** (Enum: 'Course', 'Internship', 'Workshop', 'Project')
-   `mode`: **Mandatory** (Enum: 'Online', 'Offline', 'Hybrid')
-   `startDate`: **Mandatory** (Date)
-   `endDate`: **Mandatory** (Date)

**Outsider Quiz Attempt (`OutsiderQuizAttempt.js`)**
-   `quiz`: **Mandatory** (Ref ID)
-   `userDetails`:
    -   `name`: **Mandatory**
    -   `email`: **Mandatory**
    -   `phone`: **Mandatory**
    -   `college`: **Mandatory**
    -   `education`: **Mandatory**
    -   `registerNumber`: Optional
-   `score`: **Mandatory**

### 16.4. Date & Time Logic

*   **Timestamps**: All models have `createdAt` and `updatedAt` managed automatically by Mongoose `{ timestamps: true }`.
*   **Program Duration**: Calculated via `startDate` and `endDate`.
*   **Certificate Issue Date**:
    *   Set to `Date.now()` when "Publish" is clicked.
    *   Stored in `enrollment.certificateIssuedAt`.
*   **Quiz Access**:
    *   Quizzes can have `startTime` and `endTime`. Logic in `quizController` checks `if (now < startTime || now > endTime)` to block access.

