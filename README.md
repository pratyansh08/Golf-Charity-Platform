# Golf Charity Subscription Platform

Full-stack PRD-style project for golf subscriptions, monthly draws, charity contributions, winner verification, and admin operations.

Stack:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL (Supabase/Postgres compatible)
- Auth: JWT + HttpOnly cookie support
- Payments: `mock` mode (assignment-friendly) + optional Stripe mode

## What This Project Covers

- Signup/Login with role-aware protected routes
- User profile management (name/email/password + charity selection)
- Monthly/yearly subscription lifecycle
- Mock payment transaction recording for assignment
- Optional Stripe checkout + webhook flow (env-based)
- Score management (1-45, date, latest 5 only)
- Draw engine (3/4/5 match, prize split, rollover)
- Draft -> publish draw workflow
- Winner proof upload + admin approve/reject/pay flow
- Charity list/detail/select + independent donation
- Admin dashboard APIs for users, subscriptions, draws, winners, charities, analytics
- Automated tests (backend + frontend)

## Project Structure

```text
Golf Charity Subscription Platform/
|-- backend/
|   |-- database/
|   |   `-- schema.sql
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- app.js
|   |   `-- server.js
|   |-- tests/
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- test/
|   |   `-- styles.css
|   |-- .env.example
|   `-- package.json
`-- README.md
```

## Prerequisites

- Node.js 18+ (recommended)
- npm
- PostgreSQL database URL (Supabase Postgres works)

## Environment Setup

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and update values:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
DATABASE_URL=postgresql://...
DB_SSL=true
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
AUTH_COOKIE_NAME=golf_charity_token

# Payment mode: mock (recommended for assignment) or stripe
PAYMENT_PROVIDER=mock

# Optional Stripe (required only if PAYMENT_PROVIDER=stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
STRIPE_SUCCESS_URL=http://localhost:5173/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://localhost:5173/dashboard?checkout=cancel

# Optional scheduler controls
ENABLE_MONTHLY_DRAW_SCHEDULER=true
DRAW_SCHEDULE_DAY_OF_MONTH=1
DRAW_SCHEDULER_INTERVAL_HOURS=6
```

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Run Locally

Open two terminals from project root.

Terminal 1 (backend):

```bash
cd backend
npm install
npm run dev
```

Terminal 2 (frontend):

```bash
cd frontend
npm install
npm run dev
```

App URLs:
- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5000/api/health`

## Deployment (Vercel + Render + Supabase)

Deploy sequence:
1. Create Supabase project and get Postgres `DATABASE_URL`.
2. Deploy backend to Render.
3. Deploy frontend to Vercel.

### A) Supabase (Database)

1. Create a new Supabase project.
2. Open SQL Editor and run `backend/database/schema.sql` (or let backend auto-init on first boot).
3. Copy database connection string from Supabase.
4. Use this in Render as `DATABASE_URL`.

### B) Backend on Render (GitHub)

Repository is already ready with [`render.yaml`](./render.yaml).

1. Push code to GitHub.
2. Render -> `New` -> `Blueprint` (recommended) and select repo.
3. Render will detect `render.yaml` and create the backend service.
4. In Render service, set missing secret env vars:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL` (your Vercel production URL)
5. Optional for preview deployments:
   - set `ALLOW_VERCEL_PREVIEWS=true`
   - or provide `FRONTEND_ORIGINS` as comma-separated allow-list
6. Deploy and verify:
   - `https://<your-render-service>.onrender.com/api/health`

Render backend commands:
- Build: `npm install`
- Start: `npm start`
- Root directory: `backend`

### C) Frontend on Vercel (GitHub)

Frontend is ready with [`frontend/vercel.json`](./frontend/vercel.json).

1. Vercel -> `Add New Project` -> import same GitHub repo.
2. Set Root Directory = `frontend`.
3. Add environment variables in Vercel project:
   - `VITE_API_URL=https://<your-render-service>.onrender.com/api`
   - `VITE_SUPABASE_URL=https://<your-project>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<your-anon-key>`
4. Deploy.

Vercel frontend commands:
- Install: `npm install`
- Build: `npm run build`
- Output directory: `dist`

## Production Environment Variables

### Render (Backend)

```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://<your-vercel-app>.vercel.app
FRONTEND_ORIGINS=
ALLOW_VERCEL_PREVIEWS=false
DATABASE_URL=postgresql://...
DB_SSL=true
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
AUTH_COOKIE_NAME=golf_charity_token
PAYMENT_PROVIDER=mock
ENABLE_MONTHLY_DRAW_SCHEDULER=true
DRAW_SCHEDULE_DAY_OF_MONTH=1
DRAW_SCHEDULER_INTERVAL_HOURS=6
```

### Vercel (Frontend)

```env
VITE_API_URL=https://<your-render-service>.onrender.com/api
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## Database Notes

- On backend startup, schema initialization runs automatically from `backend/src/services/databaseService.js`.
- Full reference SQL exists at `backend/database/schema.sql`.
- The system enforces one active subscription per user at DB index level.

## Payment Modes

### Assignment Mode (Recommended): `PAYMENT_PROVIDER=mock`

- No external gateway required
- Local activation/deactivation works from dashboard
- Payment entries are still recorded in `payment_transactions` with provider `mock`

### Optional Real Mode: `PAYMENT_PROVIDER=stripe`

- Uses Stripe checkout + billing portal + webhooks
- Requires full Stripe keys, product price IDs, and webhook secret
- Without Stripe config, checkout endpoints intentionally return configuration errors

## Auth and Roles

- Signup always creates `role = user` (public user cannot self-assign admin)
- Protected APIs use auth middleware (`Bearer` token and/or auth cookie)
- Admin routes require `role = admin`
- To make an admin in local DB, update user role directly in database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Core API Groups

Base URL: `/api`

- Auth: `/auth/*`
- Subscriptions: `/subscriptions/*`
- Scores: `/scores/*` (active subscription required)
- Draws: `/draws/*`
- Winners: `/winners/*`
- Charities: `/charities/*`
- Admin: `/admin/*`
- Health: `/health`

## Automated Tests

Backend tests:

```bash
cd backend
npm test
```

Frontend tests:

```bash
cd frontend
npm test
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Assignment Demo Flow (Quick)

1. Signup as user and login.
2. Subscribe using mock monthly/yearly activation.
3. Add scores (1-45) and confirm latest 5 behavior.
4. Select charity + contribution percentage (>=10), make donation.
5. Use admin account to simulate/run draw for month.
6. Publish draw and view results as user.
7. Upload winner proof from user side.
8. Approve then mark paid from admin side.
9. Open admin analytics and subscription controls.

## Troubleshooting

- Message: `Stripe checkout is disabled. Set PAYMENT_PROVIDER=stripe to enable it.`
  - This is expected in assignment/mock mode. Keep `PAYMENT_PROVIDER=mock`.

- CORS/auth issue:
  - Ensure `FRONTEND_URL` exactly matches Vercel production URL.
  - For Vercel preview URLs, set `ALLOW_VERCEL_PREVIEWS=true` or fill `FRONTEND_ORIGINS`.
  - Keep frontend API URL as `https://<render>.onrender.com/api` (with `/api`).
  - Restart backend after env changes.

- DB connection error:
  - Recheck `DATABASE_URL` and SSL setting (`DB_SSL`).

---

If you want, next I can also add a concise `README-HINGLISH.md` submission version (short and viva-friendly) so you can share it directly with evaluator.
