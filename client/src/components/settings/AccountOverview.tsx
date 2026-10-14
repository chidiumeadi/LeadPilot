import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import type { AuthUser } from '../../types/auth'

interface AccountOverviewProps {
  user: AuthUser
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

// Read-only summary — section F explicitly says not to invent billing,
// plans, or team members that don't exist, so this only ever shows fields
// that are genuinely in the Business/User models.
export default function AccountOverview({ user }: AccountOverviewProps) {
  const [copied, setCopied] = useState(false)
  const publicUrl = `${window.location.origin}/lead/${user.business.slug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can fail (permissions, insecure context) — the
      // URL is still selectable/visible on screen either way.
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-medium text-gray-900">Overview</h3>
      <dl className="mt-3 divide-y divide-gray-100 text-sm">
        <div className="flex items-center justify-between py-2">
          <dt className="text-gray-500">Business</dt>
          <dd className="font-medium text-gray-900">{user.business.name}</dd>
        </div>
        <div className="flex items-center justify-between py-2">
          <dt className="text-gray-500">Account email</dt>
          <dd className="font-medium text-gray-900">{user.email}</dd>
        </div>
        <div className="flex items-center justify-between py-2">
          <dt className="text-gray-500">Business created</dt>
          <dd className="font-medium text-gray-900">{formatDate(user.business.createdAt)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-2">
          <dt className="shrink-0 text-gray-500">Public capture link</dt>
          <dd className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-gray-900">{publicUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy public capture link"
              className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            </button>
          </dd>
        </div>
      </dl>
    </div>
  )
}
