import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'

import { allNavItems } from '../../config/navigation'

const linkBaseClasses = 'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors'
const linkInactiveClasses = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
const linkActiveClasses = 'bg-gray-900 text-white hover:bg-gray-900'

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return `${linkBaseClasses} ${isActive ? linkActiveClasses : linkInactiveClasses}`
}

const FOCUSABLE_SELECTOR = 'button:not([tabindex="-1"]), [href], input, select, textarea'

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

// Mobile-only slide-in drawer, shown below the lg breakpoint in place of
// the desktop Sidebar. Traps focus while open (Tab/Shift+Tab cycle within
// it, focus starts on the close button and returns to the trigger on
// close) so keyboard users can't Tab out into the page behind the overlay.
export default function MobileNav({ open, onClose }: MobileNavProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab' || !drawerRef.current) return

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
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
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button
        type="button"
        aria-label="Dismiss navigation menu"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 bg-gray-900/40"
      />

      <div ref={drawerRef} className="relative flex h-full w-64 flex-col bg-white shadow-xl">
        <div className="flex h-16 items-center justify-between px-4">
          <span className="text-lg font-semibold text-gray-900">LeadPilot</span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {allNavItems.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={onClose} className={navLinkClassName}>
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
