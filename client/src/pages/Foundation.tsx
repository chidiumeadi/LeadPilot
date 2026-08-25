import { useEffect, useState } from 'react'

import { checkHealth } from '../services/health'

type ConnectionState = 'checking' | 'connected' | 'error'

export default function Foundation() {
  const [status, setStatus] = useState<ConnectionState>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    checkHealth()
      .then((res) => {
        if (cancelled) return
        setStatus('connected')
        setMessage(res.message)
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
        setMessage('Could not reach the backend API.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        LeadPilot
      </h1>
      <p className="mt-2 text-gray-500">Development Environment</p>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm">
        <p className="text-sm font-medium text-gray-700">Backend connection</p>
        <p
          className={
            status === 'connected'
              ? 'mt-1 text-sm text-green-600'
              : status === 'error'
                ? 'mt-1 text-sm text-red-600'
                : 'mt-1 text-sm text-gray-400'
          }
        >
          {status === 'checking' ? 'Checking…' : message}
        </p>
      </div>
    </div>
  )
}
