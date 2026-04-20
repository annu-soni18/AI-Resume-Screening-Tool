import clsx from 'clsx'

interface Props { score: number; size?: 'sm' | 'md' | 'lg' }

function getColor(score: number) {
  if (score >= 80) return { bar: 'bg-sage-500', text: 'text-sage-700', bg: 'bg-sage-50', border: 'border-sage-200' }
  if (score >= 60) return { bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
  return { bar: 'bg-rose-400', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' }
}

export default function ScoreBadge({ score, size = 'md' }: Props) {
  const c = getColor(score)
  const rounded = Math.round(score)

  if (size === 'lg') {
    return (
      <div className={clsx('inline-flex flex-col items-center justify-center rounded-2xl border px-5 py-3', c.bg, c.border)}>
        <span className={clsx('font-mono font-semibold leading-none', c.text, 'text-3xl')}>{rounded}</span>
        <span className={clsx('text-xs mt-1', c.text, 'opacity-70')}>/ 100</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className={clsx('inline-flex items-center justify-center rounded-lg border text-xs font-mono font-semibold w-10 h-7 shrink-0', c.bg, c.border, c.text)}>
        {rounded}
      </div>
      <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', c.bar)}
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  )
}
