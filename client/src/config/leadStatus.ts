export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const leadStatusLabels: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  CONVERTED: 'Converted',
  LOST: 'Lost',
}

// Color is a secondary signal only — the text label is what actually
// communicates status; see StatusBadge.
export const leadStatusStyles: Record<LeadStatus, string> = {
  NEW: 'bg-blue-50 text-blue-700 ring-blue-200',
  CONTACTED: 'bg-amber-50 text-amber-700 ring-amber-200',
  QUALIFIED: 'bg-purple-50 text-purple-700 ring-purple-200',
  CONVERTED: 'bg-green-50 text-green-700 ring-green-200',
  LOST: 'bg-gray-100 text-gray-500 ring-gray-200',
}
