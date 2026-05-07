# School Admin Application

Admin and staff portal for managing all school operations including students, classes, fees, attendance, grades, and device verification.

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React.js 18, Vite, React Router, TanStack React Query, Recharts, Lucide React |
| Backend | Node.js 20, Express.js 4 |
| Database | MongoDB 7 + Mongoose 8 |
| Auth | JWT (8h expiry), SHA-512 password hashing |
| Security | Helmet, CORS, express-rate-limit, express-validator |
| Email | Nodemailer (SMTP) |
| File Storage | Cloudinary |
| Testing | Jest + Supertest |
| DevOps | Docker, Docker Compose, Nginx |

---

## Project Structure

```
school-admin/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection, Swagger
│   │   ├── controllers/    # HTTP request handlers
│   │   ├── dtos/           # Strip sensitive fields before response
│   │   ├── middlewares/    # auth, validate, errorHandler
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Business logic
│   │   └── scripts/        # seed.js — create initial admin
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, ProtectedRoute, Icons
│   │   ├── pages/          # One file per route
│   │   ├── services/       # Axios API calls
│   │   └── styles/         # global.css
│   └── package.json
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- npm >= 9

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET, ADMIN_ORIGIN
npm install
npm run dev
```

API runs on `http://localhost:5002`
Swagger docs: `http://localhost:5002/api-docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3001`

### 3. Create Initial Admin Account

```bash
cd backend
npm run seed
# Creates: admin@school.rw / Admin@1234
```

### 4. Run Tests

```bash
cd backend
npm test               # run all tests
npm test -- --coverage # with coverage report
```

### 5. Docker (optional)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env as needed
docker-compose up --build
```

---

## Environment Variables

See `backend/.env.example` for the full list. Key variables:

```env
MONGO_URI=mongodb://localhost:27017/school_db
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=8h
PORT=5002
NODE_ENV=development
ADMIN_ORIGIN=http://localhost:3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
CLIENT_REGISTER_URL=http://localhost:3000/register
INVITE_TTL_HOURS=72
```

> `MONGO_URI` must match the client backend — both apps share the same database.

---

## API Endpoints

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| POST | /api/auth/login | Public | Admin/teacher login |
| POST | /api/auth/staff | Admin | Create staff account |
| GET | /api/auth/me | Auth | Current user profile |
| GET | /api/devices/pending | Admin | Unverified devices |
| PATCH | /api/devices/:userId/:deviceId/verify | Admin | Approve device |
| PATCH | /api/devices/:userId/:deviceId/revoke | Admin | Revoke device |
| GET | /api/students | Staff | List students |
| POST | /api/students | Admin | Create student |
| PUT | /api/students/:id | Admin | Update student |
| PUT | /api/students/:id/grades | Staff | Update grades |
| PUT | /api/students/:id/attendance | Staff | Mark attendance |
| POST | /api/students/bulk-attendance | Staff | Bulk attendance |
| POST | /api/students/promote | Admin | Promote class |
| POST | /api/students/:id/send-invite | Admin | Send registration invite |
| GET | /api/classes | Staff | List classes |
| POST | /api/classes | Admin | Create class |
| PATCH | /api/classes/:id/assign-teacher | Admin | Assign teacher |
| GET | /api/fees | Admin | List transactions |
| PATCH | /api/fees/:txId/process | Admin | Approve/reject payment |
| GET | /api/dashboard | Admin | Dashboard stats |
| GET | /api/linking | Admin | Pending link requests |
| PATCH | /api/linking/:id | Admin | Approve/reject link |
| GET | /api/terms | Staff | List academic terms |
| GET | /api/fee-schedules | Staff | List fee schedules |

Full interactive docs available at `/api-docs` (Swagger UI).

---

## Role-Based Access

| Action | Admin | Teacher |
| ------ | ----- | ------- |
| Create/update students | Yes | No |
| View students | All | Own classes only |
| Update grades | All | Own classes only |
| Mark attendance | All | Own classes only |
| Manage classes | Yes | No |
| Verify devices | Yes | No |
| Manage fees | Yes | No |
| View dashboard | Full stats | No |

---

## Key Models

| Model | Collection | Purpose |
| ----- | ---------- | ------- |
| AdminUser | adminusers | Admin and teacher accounts |
| Student | students | Academic profiles, grades, attendance |
| Class | classes | Class definitions and timetable |
| FeeTransaction | feetransactions | Payments and refunds |
| FeeSchedule | feeschedules | Reusable fee templates |
| AuditLog | auditlogs | Activity tracking (auto-deleted after 1 year) |
| LinkingRequest | linkingrequests | Parent-student link approvals |
| AcademicTerm | academicterms | Term definitions |
| ClientUser | users | Mirror of client User model for device management |

---

## Security

- Passwords hashed with SHA-512 (per project requirements)
- JWT tokens expire after 8 hours
- All routes protected by `protect` middleware
- Teachers scoped to their assigned classes only
- Rate limiting: 200 requests per 15 minutes
- HTTP security headers via Helmet
- Input validation on all routes via express-validator
- Audit logging on all sensitive operations
