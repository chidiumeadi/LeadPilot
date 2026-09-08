import { useEffect, useRef } from 'react'

import FollowUpForm, { toDatetimeLocalValue } from './FollowUpForm'
import type { FollowUpSubmitValues } from './FollowUpForm'
import type { FollowUp } from '../../types/followUp'

const FOCUSABLE_SELECTOR = 'button:not([tabindex="-1"]), [href], input, select, textarea'

interface FollowUpFormDialogProps {
  followUp?: FollowUp
  onClose: () => void
  onSubmit: (values: FollowUpSubmitValues) => Promise<void>
  serverError?: string | null
}

// Same focus-trap pattern as DeleteLeadDialog/DeleteFollowUpDialog: focus
// moves into the dialog on open, Tab/Shift+Tab cycle within it, Escape and
// the (keyboard-unreachable) backdrop both close it, and focus returns to
// the trigger on close.
export default function FollowUpFormDialog({ followUp, onClose, onSubmit, serverError }: FollowUpFormDialogProps) {
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
      aria-labelledby="follow-up-dialog-title"
    >
      <button
        type="button"
        aria-label="Dismiss dialog"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 bg-gray-900/40"
      />

      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 id="follow-up-dialog-title" className="mb-4 text-base font-semibold text-gray-900">
          {followUp ? 'Edit follow-up' : 'Add follow-up'}
        </h2>
        <FollowUpForm
          defaultValues={
            followUp
              ? {
                  type: followUp.type,
                  scheduledAt: toDatetimeLocalValue(followUp.scheduledAt),
                  notes: followUp.notes ?? '',
                }
              : undefined
          }
          onSubmit={onSubmit}
          onCancel={onClose}
          submitLabel={followUp ? 'Save changes' : 'Create follow-up'}
          serverError={serverError}
        />
      </div>
    </div>
  )
}
