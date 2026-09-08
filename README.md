# LeadPilot

LeadPilot is a B2B SaaS platform that helps small businesses capture, organize,
and follow up on leads coming from channels like WhatsApp, Instagram,
Facebook, phone calls, referrals, and their website — so no potential
customer gets forgotten.

> **Status:** Phase 5 — Follow-Up System. Follow-up *records* can be
> created and managed from a lead's page, but nothing is executed
> automatically — no emails/SMS/WhatsApp are sent and no scheduled
> jobs run. That automation, along with notifications and analytics,
> is implemented in later development phases.

## Tech Stack

**Frontend** (`client/`)
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- Zod

**Backend** (`server/`)
- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL

## Project Structure

```
leadpilot/
├── client/          # React + TypeScript frontend (Vite)
│   └── src/
│       ├── components/ # AuthCard, FormField, dashboard shell, leads/, followUps/, etc.
│       ├── config/     # env variable access, navigation, lead/follow-up status
│       ├── context/    # AuthContext (auth state)
│       ├── hooks/       # small reusable hooks (debounce, etc.)
│       ├── pages/      # route-level components (leads/, public/, etc.)
│       ├── services/   # API client (Axios) + auth/lead/public/follow-up calls
│       ├── types/       # shared frontend types
│       └── utils/       # small helpers (API error extraction)
├── server/          # Node + Express + TypeScript backend
│   ├── src/
│   │   ├── config/       # env, Prisma client, CORS, cookie config
│   │   ├── controllers/  # request handlers
│   │   ├── middleware/   # auth, rate limiting, error handling
│   │   ├── routes/       # Express routers (incl. the unauthenticated public router)
│   │   ├── services/     # business logic (auth, business, leads, public, follow-ups, tokens)
│   │   ├── utils/        # shared helpers (validation, slugify)
│   │   ├── validators/   # Zod request schemas
│   │   └── app.ts        # Express app entry point
│   └── prisma/
│       ├── schema.prisma     # businesses, users, password_reset_tokens, leads, follow_ups
│       └── migrations/
├── README.md
├── .gitignore
└── package.json     # root convenience scripts
```

## Local Development

### 1. Install dependencies

```bash
npm install --prefix client
npm install --prefix server
npm install   # root, for the concurrently dev runner
```

### 2. Configure environment variables

Copy the example files and fill in real values for your machine:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

See [Environment Variables](#environment-variables) below for what each one means.

### 3. Set up the database

You need a running PostgreSQL instance and `DATABASE_URL` pointed at it.
Then generate the Prisma client and apply migrations:

```bash
npm run prisma:generate --prefix server
npm run prisma:migrate --prefix server
```

### 4. Run the app

From the repository root, this starts both the frontend and backend
together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:3000
```

Visiting the frontend redirects to `/login`. From there you can
register a new account (which also creates your business), log in,
log out, and use the forgot-password / reset-password flow. See
[API Endpoints](#api-endpoints) below.

Every business also gets a public lead-capture page at
`/lead/:businessSlug` (e.g. `/lead/your-business-slug`, using the slug
shown in your dashboard) — no login required. Submissions there show
up in Lead Management with source `PUBLIC_FORM`.

## API Endpoints

| Method | Path                       | Auth required | Purpose                              |
|--------|----------------------------|:--------------:|---------------------------------------|
| POST   | `/api/auth/register`      | No             | Create a user + business, log in       |
| POST   | `/api/auth/login`         | No             | Log in with email + password           |
| POST   | `/api/auth/logout`        | No             | Clear the auth cookie                  |
| GET    | `/api/auth/me`             | Yes            | Return the current authenticated user  |
| POST   | `/api/auth/forgot-password`| No             | Request a password-reset email/link    |
| POST   | `/api/auth/reset-password` | No             | Reset password with a valid token      |
| GET    | `/api/business`            | Yes            | Get the authenticated user's business  |
| PATCH  | `/api/business`            | Yes            | Update the authenticated user's business|
| GET    | `/api/leads`                | Yes            | List the business's leads (pagination, search, status filter) |
| POST   | `/api/leads`                | Yes            | Create a lead (source is always `MANUAL` here) |
| GET    | `/api/leads/:id`            | Yes            | Get one lead (404 if it belongs to another business) |
| PATCH  | `/api/leads/:id`            | Yes            | Update a lead (business ownership can't be changed) |
| DELETE | `/api/leads/:id`            | Yes            | Delete a lead |
| GET    | `/api/public/business/:businessSlug` | No   | Public-safe business info (name, slug) for the lead-capture page |
| POST   | `/api/public/leads/:businessSlug`    | No   | Anonymous lead submission (source is always `PUBLIC_FORM`) |
| GET    | `/api/follow-ups`           | Yes            | List the business's follow-ups (filter by `leadId`, `status`, or `when=upcoming\|overdue`) |
| POST   | `/api/follow-ups`           | Yes            | Create a follow-up for one of the business's own leads (always starts `PENDING`) |
| GET    | `/api/follow-ups/:id`       | Yes            | Get one follow-up |
| PATCH  | `/api/follow-ups/:id`       | Yes            | Update type/scheduledAt/notes (status can't be changed this way) |
| POST   | `/api/follow-ups/:id/complete` | Yes         | Mark a pending follow-up completed (server sets `completedAt`) |
| POST   | `/api/follow-ups/:id/cancel`   | Yes         | Mark a pending follow-up cancelled |
| DELETE | `/api/follow-ups/:id`       | Yes            | Delete a follow-up |

Authentication uses a JWT stored in an `HttpOnly` cookie — the frontend
never touches the token directly. Every `/api/leads` and
`/api/follow-ups` query is scoped to the authenticated user's business
at the database level. The `/api/public/*` routes are the only
unauthenticated ones and are rate limited separately (stricter than
the rest of the app) since they're open to anonymous submissions.

Follow-ups are records only — creating one with a future `scheduledAt`
does not send anything or schedule any job. Actually executing a
follow-up (email/SMS/WhatsApp) is a later phase.

## Environment Variables

### `client/.env`

| Variable       | Description                          |
|----------------|---------------------------------------|
| `VITE_API_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api` |

### `server/.env`

| Variable       | Description                          |
|----------------|---------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string           |
| `JWT_SECRET`   | Secret used for signing auth tokens    |
| `CLIENT_URL`   | Frontend origin, used for CORS         |
| `SERVER_URL`   | Backend's own public URL               |
| `PORT`         | Port the Express server listens on (defaults to `5000`) |

Never commit real values — only `.env.example` files (with variable
names but no secrets) are tracked in Git.

## Development Philosophy

This project is built in controlled phases, each with a clear scope,
tested before moving to the next, always leaving the repository in a
working state. See the LeadPilot MVP Technical Specification for the
full phase breakdown.
