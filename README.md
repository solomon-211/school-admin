# School Admin Application

Admin and staff portal for managing all school operations — students, classes, teachers, fees, attendance, grades, device verification, and academic terms.

---

## Tech Stack

| Layer | Technology | Version |
| ----- | ---------- | ------- |
| Frontend | React.js | ^18.3.1 |
| Frontend Routing | React Router DOM | ^6.23.1 |
| Frontend State | TanStack React Query | ^5.40.0 |
| Frontend Charts | Recharts | ^2.12.7 |
| Frontend Icons | Lucide React | ^1.14.0 |
| HTTP Client | Axios | ^1.7.2 |
| Build Tool | Vite | ^5.3.1 |
| Backend Runtime | Node.js | ^20 |
| Backend Framework | Express.js | ^4.19.2 |
| Database | MongoDB | 7.0 |
| ODM | Mongoose | ^8.4.1 |
| Authentication | JWT (jsonwebtoken) | ^9.0.2 |
| Password Hashing | SHA-512 (crypto built-in) | — |
| Security Headers | Helmet.js | ^7.1.0 |
| Rate Limiting | express-rate-limit | ^7.3.1 |
| Input Validation | express-validator | ^7.1.0 |
| Email | Nodemailer | ^8.0.7 |
| File Uploads | Multer + Cloudinary | — |
| HTTP Logging | Morgan | ^1.10.0 |
| API Docs | Swagger UI (swagger-ui-express) | — |
| Testing | Jest + Supertest | ^29.7.0 |
| Dev Server | Nodemon | ^3.1.3 |
| Containerization | Docker + Docker Compose | — |
| Web Server | Nginx | — |

---

## Project Structure

```
school-admin/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js           # MongoDB connection
│   │   │   └── swagger.js      # Swagger/OpenAPI config
│   │   ├── controllers/        # HTTP request handlers
│   │   ├── dtos/
│   │   │   └── adminDto.js     # Strip sensitive fields before API response
│   │   ├── middlewares/
│   │   │   ├── auth.js         # JWT verification, role checks (protect, adminOnly, staffOnly)
│   │   │   ├── errorHandler.js # Global error handler
│   │   │   └── validate.js     # express-validator error collector
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express routers
│   │   ├── services/           # Business logic
│   │   └── scripts/
│   │       └── seed.js         # Creates initial admin account
│   ├── __tests__/              # Jest test files
│   ├── .env.example
│   ├── jest.config.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx          # Sidebar + topbar (role-aware nav)
│   │   │   ├── ProtectedRoute.jsx  # Auth + role guard
│   │   │   ├── PasswordInput.jsx   # Show/hide password field
│   │   │   └── Icons.jsx           # Shared icon wrappers
│   │   ├── pages/                  # One file per route
│   │   ├── services/
│   │   │   ├── api.js              # Axios instance with JWT interceptor
│   │   │   ├── adminService.js     # All API call functions
│   │   │   └── authService.js      # Login, logout, token storage
│   │   └── styles/
│   │       └── global.css
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas) — must use the same instance as the client app
- npm >= 9

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — at minimum set MONGO_URI, JWT_SECRET, ADMIN_ORIGIN
npm install
npm run dev
```

- API: `http://localhost:5002`
- Swagger UI: `http://localhost:5002/api-docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:3001`

### 3. Create Initial Admin Account

```bash
cd backend
npm run seed
# Creates: admin@school.rw / Admin@1234
```

### 4. Run Tests

```bash
cd backend
npm test                 # run all tests
npm test -- --coverage   # with coverage report
npm test -- --watch      # watch mode
```

### 5. Docker

```bash
cp backend/.env.example backend/.env
# Edit backend/.env as needed
docker-compose up --build
# API:      http://localhost:5002
# Frontend: http://localhost:3001
```

---

## Environment Variables

Full list in `backend/.env.example`:

```env
PORT=5002
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/school_db

JWT_SECRET=your_admin_jwt_secret_here
JWT_EXPIRES_IN=8h

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=SchoolAdmin <your_email@gmail.com>

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ADMIN_API_KEY=your_admin_api_key_here
ADMIN_ORIGIN=http://localhost:3001

CLIENT_REGISTER_URL=http://localhost:3000/register
INVITE_TTL_HOURS=72

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
```

> `MONGO_URI` must be the same value used in the client app backend — both apps share one database.

---

## API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| POST | /api/auth/login | Public | Admin or teacher login — returns JWT |
| POST | /api/auth/staff | Admin | Create a new admin or teacher account |
| GET | /api/auth/me | Auth | Get current authenticated user profile |
| POST | /api/auth/forgot-password | Public | Send password reset link to email |
| POST | /api/auth/reset-password | Public | Reset password using token from email |

### Device Verification — `/api/devices`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | /api/devices/pending | Admin | List all users with unverified devices |
| GET | /api/devices/users | Admin | List all client app users with device status |
| PATCH | /api/devices/:userId/:deviceId/verify | Admin | Approve a device — user can now log in |
| PATCH | /api/devices/:userId/:deviceId/revoke | Admin | Revoke a device — blocks future logins |

### Students — `/api/students`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | /api/students | Staff | List all active students (teachers see own classes only) |
| POST | /api/students | Admin | Create a new student record |
| GET | /api/students/unlinked-users | Admin | List registered users not yet linked to a student |
| GET | /api/students/:id | Staff | Get full student profile (grades, attendance, class) |
| PUT | /api/students/:id | Admin | Update student info (name, class, DOB, gender, balance) |
| PUT | /api/students/:id/grades | Staff | Add or update grades (scoped to assigned class for teachers) |
| PUT | /api/students/:id/attendance | Staff | Mark attendance for one student |
| POST | /api/students/bulk-attendance | Staff | Mark attendance for all students in a class at once |
| POST | /api/students/promote | Admin | Move all students from one class to another (end of year) |
| PATCH | /api/students/:id/link-account | Admin | Link student record to a registered user account by email |
| POST | /api/students/:id/send-invite | Admin | Send registration invite email with auto-link token |

### Classes — `/api/classes`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | /api/classes | Staff | List all active classes |
| GET | /api/classes/teachers | Staff | List all active teachers (for dropdowns) |
| GET | /api/classes/:id | Staff | Get class details including timetable and teachers |
| POST | /api/classes | Admin | Create a new class |
| PUT | /api/classes/:id | Admin | Update class info (name, grade, section, year) |
| PATCH | /api/classes/:id/assign-teacher | Admin | Assign a teacher to a subject in this class |
| PATCH | /api/classes/:id/remove-teacher | Admin | Remove a teacher from a subject |
| PUT | /api/classes/:id/timetable | Admin | Set the weekly timetable for a class |

### Fee Management — `/api/fees`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | /api/fees | Admin | List all transactions (filter by studentId, status, type) |
| GET | /api/fees/stats | Admin | Total collected, total refunded, pending withdrawal count |
| POST | /api/fees/charge | Admin | Charge a fee directly to a student (creates pending charge) |
| PATCH | /api/fees/charge/:txId | Admin | Edit a pending charge (amount or description) |
| DELETE | /api/fees/charge/:txId | Admin | Delete a pending charge |
| PATCH | /api/fees/:txId/process | Admin | Approve or reject a deposit or withdrawal |

### Fee Schedules — `/api/fee-schedules`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | /api/fee-schedules | Staff | List all active fee schedule templates |
| POST | /api/fee-schedules | Admin | Create a fee schedule template |
| PUT | /api/fee-schedules/:id | Admin | Update a fee schedule |
| DELETE | /api/fee-schedules/:id | Admin | Soft-delete a fee schedule (sets isActive: false) |

### Dashboard — `/api/dashboard`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | /api/dashboard | Admin | Total students, teachers, classes, parents, attendance rate, pending devices, fee totals |

### Linking Requests — `/api/linking`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | /api/linking | Admin | List all pending parent-to-student link requests |
| PATCH | /api/linking/:id | Admin | Approve or reject a linking request |

### Academic Terms — `/api/terms`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | /api/terms | Staff | List all terms sorted by start date |
| GET | /api/terms/current | Staff | Get the currently active term |
| POST | /api/terms | Admin | Create a new academic term |
| PATCH | /api/terms/:id/set-current | Admin | Mark a term as the current active term |
| DELETE | /api/terms/:id | Admin | Delete a term |

---

## Role-Based Access

| Action | Admin | Teacher |
| ------ | ----- | ------- |
| Login | Yes | Yes |
| View dashboard stats | Yes | No |
| Create/update students | Yes | No |
| View students | All | Own classes only |
| Update grades | All students | Own classes only |
| Mark attendance | All students | Own classes only |
| Bulk attendance | All classes | Own classes only |
| Promote students | Yes | No |
| Manage classes | Yes | No |
| View classes | Yes | Yes |
| Verify/revoke devices | Yes | No |
| Approve/reject fees | Yes | No |
| Charge fees to students | Yes | No |
| Manage fee schedules | Yes | No |
| Manage academic terms | Yes | No |
| Review linking requests | Yes | No |
| Create staff accounts | Yes | No |

---

## Database Models

| Model | Collection | Purpose |
| ----- | ---------- | ------- |
| AdminUser | adminusers | Admin and teacher accounts |
| Student | students | Academic profiles, grades, attendance (shared with client app) |
| Class | classes | Class definitions, teacher assignments, timetable (shared) |
| FeeTransaction | feetransactions | Deposits, withdrawals, and admin charges (shared) |
| FeeSchedule | feeschedules | Reusable fee templates |
| AuditLog | auditlogs | Activity trail — auto-deleted after 1 year |
| LinkingRequest | linkingrequests | Parent-to-student account link approvals |
| AcademicTerm | academicterms | Term definitions with start/end dates |
| ClientUser | users | Mirror of client User model — used for device management |

---

## Security

- Passwords hashed with SHA-512 (per project specification)
- JWT tokens expire after 8 hours
- All routes protected by `protect` middleware (JWT verification)
- Teachers scoped to their assigned classes only — enforced in service layer
- Rate limiting: 200 requests per 15 minutes per IP
- HTTP security headers via Helmet
- CORS restricted to `ADMIN_ORIGIN`
- Input validation and sanitization on all routes via express-validator
- Audit logging on all sensitive operations (grades, attendance, fees, device approvals)
- Passwords never returned in API responses (excluded via DTOs)
