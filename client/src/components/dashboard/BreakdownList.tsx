interface BreakdownItem {
  key: string
  label: string
  count: number
}

interface BreakdownListProps {
  items: BreakdownItem[]
  emptyLabel: string
}

export default function BreakdownList({ items, emptyLabel }: BreakdownListProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  if (total === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">{emptyLabel}</p>
  }

  const max = Math.max(1, ...items.map((item) => item.count))

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-gray-700">{item.label}</span>
            <span className="font-medium text-gray-900">{item.count}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gray-900"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
