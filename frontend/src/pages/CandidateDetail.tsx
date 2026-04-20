import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { candidatesApi } from '../api/client'
import ScoreBadge from '../components/ui/ScoreBadge'
import StatusBadge from '../components/ui/StatusBadge'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Sparkles, FileText, Mail, Phone, Clock, Briefcase } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_OPTIONS = ['pending', 'shortlisted', 'rejected', 'interviewing', 'hired']

function parseList(val: string): string[] {
  if (!val) return []
  try { return JSON.parse(val) } catch { return val.split(',').map(s => s.trim()).filter(Boolean) }
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} className="text-ink-400" />
        <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Pill({ text, variant }: { text: string; variant: 'green' | 'red' | 'neutral' }) {
  return (
    <span className={clsx(
      'inline-flex items-center text-xs px-2.5 py-1 rounded-full border',
      variant === 'green' && 'bg-sage-50 text-sage-700 border-sage-200',
      variant === 'red' && 'bg-rose-50 text-rose-600 border-rose-200',
      variant === 'neutral' && 'bg-ink-100 text-ink-600 border-ink-200',
    )}>
      {text}
    </span>
  )
}

export default function CandidateDetail() {
  const { jobId, candidateId } = useParams<{ jobId: string; candidateId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: c, isLoading } = useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: () => candidatesApi.get(Number(candidateId)).then(r => r.data),
    refetchInterval: (q) => q.state.data?.status === 'screening' ? 5000 : false,
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => candidatesApi.updateStatus(Number(candidateId), status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', candidateId] })
      qc.invalidateQueries({ queryKey: ['candidates', Number(jobId)] })
      toast.success('Status updated')
    },
  })

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-4 bg-ink-100 rounded w-24" />
        <div className="h-8 bg-ink-100 rounded w-64" />
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-ink-100 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (!c) return null

  const matchingSkills = parseList(c.matching_skills)
  const missingSkills = parseList(c.missing_skills)
  const greenFlags = parseList(c.green_flags)
  const redFlags = parseList(c.red_flags)

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(`/jobs/${jobId}`)} className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 transition-colors mb-6">
        <ArrowLeft size={13} /> Back to candidates
      </button>

      {/* Hero card */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between gap-6">
          {/* Avatar + name */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ink-200 to-ink-300 flex items-center justify-center text-xl font-semibold text-ink-700 shrink-0">
              {c.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink-900">{c.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-ink-400 hover:text-ink-700 transition-colors">
                    <Mail size={11} /> {c.email}
                  </a>
                )}
                {c.phone && (
                  <span className="flex items-center gap-1 text-xs text-ink-400">
                    <Phone size={11} /> {c.phone}
                  </span>
                )}
                {c.years_experience > 0 && (
                  <span className="flex items-center gap-1 text-xs text-ink-400">
                    <Briefcase size={11} /> {c.years_experience} yrs experience
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <StatusBadge status={c.status} />
                <span className="text-xs text-ink-400 flex items-center gap-1">
                  <Clock size={10} />
                  {c.screened_at
                    ? `Screened ${formatDistanceToNow(new Date(c.screened_at), { addSuffix: true })}`
                    : `Uploaded ${formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="shrink-0 text-center">
            <ScoreBadge score={c.match_score} size="lg" />
            <p className="text-[10px] text-ink-400 mt-2">match score</p>
          </div>
        </div>

        {/* Status change */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-ink-100">
          <span className="text-xs text-ink-500 mr-1">Move to:</span>
          {STATUS_OPTIONS.filter(s => s !== c.status).map(s => (
            <button
              key={s}
              onClick={() => statusMutation.mutate(s)}
              className={clsx(
                'text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium',
                s === 'shortlisted' && 'border-sage-200 text-sage-700 hover:bg-sage-50',
                s === 'rejected' && 'border-rose-200 text-rose-600 hover:bg-rose-50',
                s === 'interviewing' && 'border-purple-200 text-purple-700 hover:bg-purple-50',
                s === 'hired' && 'border-sage-300 text-sage-800 hover:bg-sage-100',
                s === 'pending' && 'border-ink-200 text-ink-500 hover:bg-ink-50',
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {c.screening_error && (
        <div className="mb-5 flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4">
          <AlertTriangle size={15} className="text-rose-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-rose-700">Screening error</p>
            <p className="text-xs text-rose-600 mt-0.5">{c.screening_error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Summary */}
        {c.ai_summary && (
          <div className="md:col-span-2">
            <Section title="AI summary" icon={Sparkles}>
              <p className="text-sm text-ink-700 leading-relaxed">{c.ai_summary}</p>
            </Section>
          </div>
        )}

        {/* Matching skills */}
        <Section title="Matching skills" icon={CheckCircle}>
          {matchingSkills.length ? (
            <div className="flex flex-wrap gap-2">
              {matchingSkills.map(s => <Pill key={s} text={s} variant="green" />)}
            </div>
          ) : <p className="text-xs text-ink-400">None identified</p>}
        </Section>

        {/* Missing skills */}
        <Section title="Missing skills" icon={XCircle}>
          {missingSkills.length ? (
            <div className="flex flex-wrap gap-2">
              {missingSkills.map(s => <Pill key={s} text={s} variant="red" />)}
            </div>
          ) : <p className="text-xs text-ink-400 italic">No gaps detected</p>}
        </Section>

        {/* Green flags */}
        <Section title="Green flags" icon={CheckCircle}>
          {greenFlags.length ? (
            <ul className="space-y-2">
              {greenFlags.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                  <CheckCircle size={13} className="text-sage-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-ink-400">None noted</p>}
        </Section>

        {/* Red flags */}
        <Section title="Red flags" icon={AlertTriangle}>
          {redFlags.length ? (
            <ul className="space-y-2">
              {redFlags.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                  <XCircle size={13} className="text-rose-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-ink-400 italic">None detected</p>}
        </Section>

        {/* File info */}
        <div className="md:col-span-2">
          <Section title="Resume file" icon={FileText}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-ink-100 rounded-xl flex items-center justify-center">
                  <FileText size={15} className="text-ink-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-800">{c.filename}</p>
                  <p className="text-xs text-ink-400">Uploaded {format(new Date(c.created_at), 'MMM d, yyyy · h:mm a')}</p>
                </div>
              </div>
              <a
                href={`/uploads/${c.file_path.split('/').pop()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs"
              >
                View file
              </a>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
