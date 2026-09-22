import { useEffect, useRef } from 'react'

import LogCommunicationForm from './LogCommunicationForm'
import type { LogCommunicationInput } from '../../services/leadService'

const FOCUSABLE_SELECTOR = 'button:not([tabindex="-1"]), [href], input, select, textarea'

interface LogCommunicationDialogProps {
  onClose: () => void
  onSubmit: (values: LogCommunicationInput) => Promise<void>
  serverError?: string | null
}

// Same focus-trap pattern as FollowUpFormDialog/DeleteLeadDialog: focus
// moves into the dialog on open, Tab/Shift+Tab cycle within it, Escape and
// the (keyboard-unreachable) backdrop both close it, and focus returns to
// the trigger on close.
export default function LogCommunicationDialog({ onClose, onSubmit, serverError }: LogCommunicationDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const firstField = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    firstField?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previouslyFocused?.focus()
    }
  }, [onClose])

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-communication-dialog-title"
    >
      <button
        type="button"
        aria-label="Dismiss dialog"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 bg-gray-900/40"
      />

      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 id="log-communication-dialog-title" className="mb-4 text-base font-semibold text-gray-900">
          Log communication
        </h2>
        <LogCommunicationForm onSubmit={onSubmit} onCancel={onClose} serverError={serverError} />
      </div>
    </div>
  )
}
