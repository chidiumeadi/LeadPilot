import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createApp } from '../src/app'
import { parseTrustProxy } from '../src/config/env'

// Single-service deploy settings (render.yaml): serving the built client
// from the API's origin, and trusting the platform's proxy hop. Both are
// off by default, which every other test file relies on.

describe('parseTrustProxy', () => {
  it('treats unset, empty and 0 as "no proxy"', () => {
    expect(parseTrustProxy(undefined)).toBe(false)
    expect(parseTrustProxy('')).toBe(false)
    expect(parseTrustProxy('  ')).toBe(false)
    expect(parseTrustProxy('0')).toBe(false)
  })

  it('accepts a whole number of hops', () => {
    expect(parseTrustProxy('1')).toBe(1)
    expect(parseTrustProxy(' 2 ')).toBe(2)
  })

  it.each(['true', 'loopback', '10.0.0.0/8', '-1', '1.5', 'one'])('rejects %j', (raw) => {
    expect(() => parseTrustProxy(raw)).toThrow(/whole number/)
  })
})

describe('trust proxy and per-client rate limiting', () => {
  // forgot-password allows 5 requests per 15 minutes per client IP.
  const exhaust = async (app: ReturnType<typeof createApp>, ip: string) => {
    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', ip).send({ email: 'nobody@example.com' })
    }
  }
  const attempt = (app: ReturnType<typeof createApp>, ip: string) =>
    request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', ip).send({ email: 'nobody@example.com' })

  it('with one trusted hop, each forwarded client IP gets its own limit', async () => {
    const app = createApp({ trustProxy: 1 })
    await exhaust(app, '203.0.113.1')

    expect((await attempt(app, '203.0.113.1')).status).toBe(429)
    expect((await attempt(app, '203.0.113.2')).status).toBe(200)
  })

  it('without a trusted proxy, X-Forwarded-For is ignored (cannot dodge the limit)', async () => {
    const app = createApp({ trustProxy: false })
    await exhaust(app, '203.0.113.1')

    expect((await attempt(app, '203.0.113.2')).status).toBe(429)
  })
})

describe('serving the built client from the API origin', () => {
  let distDir: string
  const INDEX_HTML = '<!doctype html><html><body><div id="root"></div></body></html>'

  beforeAll(() => {
    distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'leadpilot-client-dist-'))
    fs.writeFileSync(path.join(distDir, 'index.html'), INDEX_HTML)
    fs.mkdirSync(path.join(distDir, 'assets'))
    fs.writeFileSync(path.join(distDir, 'assets', 'app-abc123.js'), 'console.log("app")')
  })

  afterAll(() => {
    fs.rmSync(distDir, { recursive: true, force: true })
  })

  it('serves index.html at the root and for client-side routes', async () => {
    const app = createApp({ clientDistDir: distDir })

    for (const route of ['/', '/dashboard', '/leads/123', '/lead/some-business', '/follow-ups?view=overdue']) {
      const res = await request(app).get(route)
      expect(res.status, route).toBe(200)
      expect(res.headers['content-type'], route).toMatch(/text\/html/)
      expect(res.text, route).toBe(INDEX_HTML)
    }
  })

  it('serves built assets as files', async () => {
    const res = await request(createApp({ clientDistDir: distDir })).get('/assets/app-abc123.js')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/javascript/)
  })

  it('API routes still answer with JSON, including unknown /api paths', async () => {
    const app = createApp({ clientDistDir: distDir })

    const health = await request(app).get('/api/health')
    expect(health.status).toBe(200)
    expect(health.body.success).toBe(true)

    for (const route of ['/api', '/api/does-not-exist']) {
      const res = await request(app).get(route)
      expect(res.status, route).toBe(404)
      expect(res.headers['content-type'], route).toMatch(/application\/json/)
    }

    // Paths under an authenticated router hit `authenticate` first: still
    // JSON, never the HTML page.
    for (const route of ['/api/leads', '/api/leads/x/y/z']) {
      const res = await request(app).get(route)
      expect(res.status, route).toBe(401)
      expect(res.headers['content-type'], route).toMatch(/application\/json/)
    }
  })

  it('non-GET requests to non-API paths get the JSON 404, not the page', async () => {
    const res = await request(createApp({ clientDistDir: distDir })).post('/dashboard').send({})

    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toMatch(/application\/json/)
  })

  it('refuses to start when the build has no index.html', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'leadpilot-empty-dist-'))
    try {
      expect(() => createApp({ clientDistDir: emptyDir })).toThrow(/no index.html/)
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true })
    }
  })

  it('without CLIENT_DIST_DIR (local dev and tests) nothing extra is served', async () => {
    const res = await request(createApp()).get('/')

    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toMatch(/application\/json/)
  })
})
