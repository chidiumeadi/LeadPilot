import { describe, expect, it } from 'vitest'

import { api } from './helpers/app'

describe('health', () => {
  it('GET /api/health reports the API is running', async () => {
    const res = await api().get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true, message: 'LeadPilot API is running' })
  })

  it('unknown routes return a JSON 404', async () => {
    const res = await api().get('/api/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ success: false, message: 'Route not found: GET /api/does-not-exist' })
  })
})
