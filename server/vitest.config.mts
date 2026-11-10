import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/setup/globalSetup.ts'],
    // Order matters: env.ts loads .env.test before database.ts imports prisma.
    setupFiles: ['tests/setup/env.ts', 'tests/setup/database.ts'],
    // Every test file shares the one test database and truncates it between
    // tests, so files must run one at a time.
    fileParallelism: false,
    // bcrypt hashing during registration/login makes auth-heavy tests slower
    // than the 5s default allows on a cold run.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
})
