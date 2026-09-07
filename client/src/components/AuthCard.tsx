import type { ReactNode } from 'react'

export default function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-gray-900">LeadPilot</h1>
        <div className="mt-8 rounded-lg border border-gray-200 bg-white px-6 py-8 shadow-sm">
          <h2 className="mb-6 text-lg font-medium text-gray-900">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  )
}
