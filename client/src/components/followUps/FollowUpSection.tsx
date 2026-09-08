import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

import EmptyState from '../dashboard/EmptyState'
import DeleteFollowUpDialog from './DeleteFollowUpDialog'
import FollowUpFormDialog from './FollowUpFormDialog'
import type { FollowUpSubmitValues } from './FollowUpForm'
import FollowUpStatusBadge from './FollowUpStatusBadge'
import { followUpTypeLabels } from '../../config/followUp'
import * as followUpService from '../../services/followUpService'
import type { FollowUp } from '../../types/followUp'
import { getApiErrorMessage } from '../../utils/apiError'

interface FollowUpSectionProps {
  leadId: string
}

type DialogState = { mode: 'create' } | { mode: 'edit'; followUp: FollowUp } | null

function formatScheduled(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

interface FollowUpGroupProps {
  title: string
  items: FollowUp[]
  emphasis?: 'overdue'
  emptyLabel?: string
  busyId: string | null
  onEdit?: (followUp: FollowUp) => void
  onComplete?: (id: string) => void
  onCancel?: (id: string) => void
  onDelete: (followUp: FollowUp) => void
}

function FollowUpGroup({ title, items, emphasis, emptyLabel, busyId, onEdit, onComplete, onCancel, onDelete }: FollowUpGroupProps) {
  if (items.length === 0 && !emptyLabel) return null

  return (
    <div>
      <h4
        className={`text-xs font-semibold tracking-wide uppercase ${emphasis === 'overdue' ? 'text-red-600' : 'text-gray-400'}`}
      >
        {title}
      </h4>

      {items.length === 0 && emptyLabel && <p className="mt-2 text-sm text-gray-400">{emptyLabel}</p>}

      {items.length > 0 && (
        <ul className="mt-2 space-y-2">
          {items.map((followUp) => (
            <li
              key={followUp.id}
              className={`rounded-lg border p-3 ${emphasis === 'overdue' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {followUpTypeLabels[followUp.type]} — {formatScheduled(followUp.scheduledAt)}
                  </p>
                  {followUp.notes && (
                    <p className="mt-1 text-sm whitespace-pre-wrap text-gray-500">{followUp.notes}</p>
                  )}
                </div>
                <FollowUpStatusBadge status={followUp.status} />
              </div>

              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(followUp)}
                    disabled={busyId === followUp.id}
                    className="font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    Edit
                  </button>
                )}
                {onComplete && (
                  <button
                    type="button"
                    onClick={() => onComplete(followUp.id)}
                    disabled={busyId === followUp.id}
                    className="font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
                  >
                    Mark complete
                  </button>
                )}
                {onCancel && (
                  <button
                    type="button"
                    onClick={() => onCancel(followUp.id)}
                    disabled={busyId === followUp.id}
                    className="font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
                <button type="button" onClick={() => onDelete(followUp)} className="font-medium text-red-600 hover:text-red-700">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function FollowUpSection({ leadId }: FollowUpSectionProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FollowUp | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = async () => {
    setLoadState('loading')
    try {
      const result = await followUpService.fetchFollowUps({ leadId, limit: 100 })
      setFollowUps(result.items)
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  const openCreate = () => {
    setFormError(null)
    setDialog({ mode: 'create' })
  }

  const openEdit = (followUp: FollowUp) => {
    setFormError(null)
    setDialog({ mode: 'edit', followUp })
  }

  const handleCreate = async (values: FollowUpSubmitValues) => {
    setFormError(null)
    try {
      await followUpService.createFollowUp({ leadId, ...values })
      setDialog(null)
      await load()
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    }
  }

  const handleEdit = async (values: FollowUpSubmitValues) => {
    if (dialog?.mode !== 'edit') return
    setFormError(null)
    try {
      await followUpService.updateFollowUp(dialog.followUp.id, values)
      setDialog(null)
      await load()
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    }
  }

  const handleComplete = async (id: string) => {
    setActionError(null)
    setBusyId(id)
    try {
      await followUpService.completeFollowUp(id)
      await load()
    } catch (err) {
      setActionError(getApiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleCancel = async (id: string) => {
    setActionError(null)
    setBusyId(id)
    try {
      await followUpService.cancelFollowUp(id)
      await load()
    } catch (err) {
      setActionError(getApiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await followUpService.deleteFollowUp(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (err) {
      setActionError(getApiErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  const now = new Date()
  const overdue = followUps.filter((f) => f.status === 'PENDING' && new Date(f.scheduledAt) < now)
  const upcoming = followUps.filter((f) => f.status === 'PENDING' && new Date(f.scheduledAt) >= now)
  const history = [...followUps]
    .filter((f) => f.status !== 'PENDING')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Follow-Ups</h3>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Follow-Up
        </button>
      </div>

      {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}

      <div className="mt-4">
        {loadState === 'loading' && <p className="py-6 text-center text-sm text-gray-400">Loading follow-ups…</p>}

        {loadState === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-6 text-center">
            <p className="text-sm text-red-700">Could not load follow-ups.</p>
            <button type="button" onClick={load} className="mt-2 text-sm font-medium text-red-700 underline">
              Try again
            </button>
          </div>
        )}

        {loadState === 'ready' && followUps.length === 0 && (
          <EmptyState title="No follow-ups yet" description="Create a follow-up to stay on top of this lead." />
        )}

        {loadState === 'ready' && followUps.length > 0 && (
          <div className="space-y-6">
            <FollowUpGroup
              title="Overdue"
              items={overdue}
              emphasis="overdue"
              busyId={busyId}
              onEdit={openEdit}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onDelete={setDeleteTarget}
            />

            <FollowUpGroup
              title="Upcoming"
              items={upcoming}
              emptyLabel="No upcoming follow-ups."
              busyId={busyId}
              onEdit={openEdit}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onDelete={setDeleteTarget}
            />

            <FollowUpGroup title="History" items={history} busyId={busyId} onDelete={setDeleteTarget} />
          </div>
        )}
      </div>

      {dialog && (
        <FollowUpFormDialog
          followUp={dialog.mode === 'edit' ? dialog.followUp : undefined}
          onClose={() => setDialog(null)}
          onSubmit={dialog.mode === 'edit' ? handleEdit : handleCreate}
          serverError={formError}
        />
      )}

      {deleteTarget && (
        <DeleteFollowUpDialog onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isDeleting={isDeleting} />
      )}
    </div>
  )
}
