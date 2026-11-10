import request from 'supertest'

import { createApp } from '../../src/app'

// One app instance per test file is enough — it holds no per-request
// state, and createApp() never listens or starts the scheduler.
export const app = createApp()

export const api = () => request(app)
