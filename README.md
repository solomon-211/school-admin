# School Admin Application

Admin and staff portal for managing school operations.

## Contents

- `frontend/` React admin interface
- `backend/` Node.js + Express API
- `.env.example` repository-level environment template (copy relevant values into `backend/.env`)

## Quick Start

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:5002` by default.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3001` by default.

## Required Environment Variables

This repository includes two templates:

- `./.env.example` (submission-level template)
- `./backend/.env.example` (runtime backend template)

For actual execution, use `backend/.env`.

## Main Features

- Admin authentication and staff creation
- Device verification and revoke flow
- Student, class, term, and fee schedule management
- Grades and attendance updates (including bulk attendance)
- Fee transaction processing and dashboard stats
- Swagger API docs at `/api-docs`

## Testing

```bash
cd backend
npm test
```
