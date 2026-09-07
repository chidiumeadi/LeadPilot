import type { UseFormRegisterReturn } from 'react-hook-form'

interface TextareaFieldProps {
  label: string
  error?: string
  rows?: number
  registration: UseFormRegisterReturn
}

export default function TextareaField({ label, error, rows = 4, registration }: TextareaFieldProps) {
  const id = registration.name

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        {...registration}
        className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
