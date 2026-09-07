import type { UseFormRegisterReturn } from 'react-hook-form'

interface FormFieldProps {
  label: string
  type?: string
  error?: string
  autoComplete?: string
  registration: UseFormRegisterReturn
}

export default function FormField({ label, type = 'text', error, autoComplete, registration }: FormFieldProps) {
  const id = registration.name

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        {...registration}
        className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
