import type { ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface SelectFieldProps {
  label: string
  error?: string
  registration: UseFormRegisterReturn
  children: ReactNode
}

export default function SelectField({ label, error, registration, children }: SelectFieldProps) {
  const id = registration.name

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={id}
        {...registration}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
