import clsx from 'clsx'

const map: Record<string, { label: string; classes: string }> = {
  pending:      { label: 'Pending',      classes: 'bg-ink-100 text-ink-500' },
  screening:    { label: 'Screening…',   classes: 'bg-amber-100 text-amber-700 animate-pulse' },
  shortlisted:  { label: 'Shortlisted',  classes: 'bg-sage-100 text-sage-700' },
  rejected:     { label: 'Rejected',     classes: 'bg-rose-100 text-rose-600' },
  interviewing: { label: 'Interviewing', classes: 'bg-purple-100 text-purple-700' },
  hired:        { label: 'Hired',        classes: 'bg-sage-200 text-sage-800 font-semibold' },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = map[status] ?? { label: status, classes: 'bg-ink-100 text-ink-500' }
  return (
    <span className={clsx('badge', s.classes)}>{s.label}</span>
  )
}
