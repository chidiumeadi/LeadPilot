// Central place to read Vite environment variables.
// Vite only exposes variables prefixed with VITE_ to client code.

export const env = {
  apiUrl: import.meta.env.VITE_API_URL as string,
} as const

if (!env.apiUrl) {
  // Fail loudly in development rather than silently hitting the wrong URL.
  // eslint-disable-next-line no-console
  console.warn('VITE_API_URL is not set. Falling back to http://localhost:5000/api')
}
