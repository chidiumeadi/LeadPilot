import { loadTestEnv } from './testEnv'

// First setupFile — must run before anything imports src/config/env.ts or
// src/config/prisma.ts, which read DATABASE_URL at import time. Kept in its
// own file because static imports are hoisted: if this lived in
// database.ts, prisma would be imported before the env was loaded.
loadTestEnv()
