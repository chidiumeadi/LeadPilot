import fs from 'node:fs'
import path from 'node:path'

import express from 'express'
import type { Express } from 'express'

// Serves the built React app from the API's own origin, for single-service
// deploys. Same origin means the HttpOnly auth cookie (SameSite=lax) and
// CORS need no cross-site configuration.
//
// Mounted after every /api router: real API routes always win, and any
// unknown /api path still gets the JSON 404 from notFoundHandler rather
// than the HTML page.
export function serveClientApp(app: Express, clientDistDir: string): void {
  const root = path.resolve(clientDistDir)
  const indexHtml = path.join(root, 'index.html')

  // Fail at startup, not on the first page view, if the build is missing.
  if (!fs.existsSync(indexHtml)) {
    throw new Error(`CLIENT_DIST_DIR has no index.html (looked in ${root}). Build the client first.`)
  }

  app.use(express.static(root, { index: false }))

  // Client-side routes (/dashboard, /leads/123, /lead/some-business, ...)
  // all load the same index.html; React Router takes it from there.
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    if (req.path === '/api' || req.path.startsWith('/api/')) return next()
    res.sendFile(indexHtml)
  })
}
