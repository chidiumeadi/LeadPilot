import { useEffect, useRef } from 'react'

interface DeleteFollowUpDialogProps {
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

const FOCUSABLE_SELECTOR = 'button:not([tabindex="-1"]), [href], input, select, textarea'

// Same pattern as DeleteLeadDialog (Phase 3): focus trap, Escape closes,
// backdrop click cancels, body scroll locked while open.
export default function DeleteFollowUpDialog({ onConfirm, onCancel, isDeleting }: DeleteFollowUpDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    cancelButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
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
  }, [onCancel])

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-followup-title"
    >
      <button
        type="button"
        aria-label="Dismiss dialog"
        onClick={onCancel}
        tabIndex={-1}
        className="absolute inset-0 bg-gray-900/40"
      />

      <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 id="delete-followup-title" className="text-base font-semibold text-gray-900">
          Delete follow-up
        </h2>
        <p className="mt-2 text-sm text-gray-500">Are you sure you want to delete this follow-up? This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
