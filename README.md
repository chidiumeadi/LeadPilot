# LeadPilot

LeadPilot is a B2B SaaS platform that helps small businesses capture, organize,
and follow up on leads coming from channels like WhatsApp, Instagram,
Facebook, phone calls, referrals, and their website — so no potential
customer gets forgotten.

> **Status:** Phase 0 — Project Foundation. Authentication, leads,
> follow-ups, notifications, and all other product functionality are
> implemented in later development phases and do not exist yet.

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
│       ├── config/    # env variable access
│       ├── pages/      # route-level components
│       └── services/   # API client (Axios)
├── server/          # Node + Express + TypeScript backend
│   ├── src/
│   │   ├── config/       # env, Prisma client, CORS config
│   │   ├── controllers/  # request handlers
│   │   ├── middleware/   # error handling, etc.
│   │   ├── routes/       # Express routers
│   │   ├── services/     # business logic (added in later phases)
│   │   ├── utils/        # shared helpers (added in later phases)
│   │   └── app.ts        # Express app entry point
│   └── prisma/
│       └── schema.prisma # PostgreSQL connection (no app models yet)
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
Then generate the Prisma client:

```bash
npm run prisma:generate --prefix server
```

(No schema migration is needed yet — Phase 0 only establishes the
connection. Application tables are added in later phases.)

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

The frontend's foundation page calls `GET /api/health` on load and
shows whether it successfully reached the backend.

## Environment Variables

### `client/.env`

| Variable       | Description                          |
|----------------|---------------------------------------|
| `VITE_API_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api` |

### `server/.env`

| Variable       | Description                          |
|----------------|---------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string           |
| `JWT_SECRET`   | Secret used for signing auth tokens (used starting Phase 1) |
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
