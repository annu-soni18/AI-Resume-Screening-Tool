import { useQuery } from '@tanstack/react-query'
import { statsApi, jobsApi } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Users, Briefcase, CheckCircle, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => statsApi.get().then(r => r.data),
    refetchInterval: 10_000,
  })

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list().then(r => r.data),
  })

  const statCards = [
    { label: 'Active jobs', value: stats?.total_jobs ?? '—', icon: Briefcase, color: 'text-ink-700', bg: 'bg-ink-100' },
    { label: 'Total candidates', value: stats?.total_candidates ?? '—', icon: Users, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Shortlisted', value: stats?.shortlisted ?? '—', icon: CheckCircle, color: 'text-sage-700', bg: 'bg-sage-50' },
    { label: 'Avg. match score', value: stats ? `${stats.avg_match_score}%` : '—', icon: TrendingUp, color: 'text-amber-700', bg: 'bg-amber-50' },
  ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900">
          {greeting}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-ink-400 mt-1">Here's what's happening across your pipeline.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center mb-4', bg)}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-semibold text-ink-900 font-mono">{value}</p>
            <p className="text-xs text-ink-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending screening alert */}
      {stats?.pending_screening! > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <Clock size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{stats!.pending_screening} resume{stats!.pending_screening > 1 ? 's' : ''}</span> currently being screened by Ollama.
          </p>
        </div>
      )}

      {/* Recent jobs */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="text-sm font-semibold text-ink-800">Recent jobs</h2>
          <button onClick={() => navigate('/jobs')} className="text-xs text-ink-400 hover:text-ink-700 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={12} />
          </button>
        </div>

        {!jobs?.length ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-ink-400">No jobs created yet.</p>
            <button onClick={() => navigate('/jobs')} className="btn-primary mt-4 text-xs">
              Create first job
            </button>
          </div>
        ) : (
          <div className="divide-y divide-ink-50">
            {jobs.slice(0, 6).map(job => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-ink-50 cursor-pointer transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800 group-hover:text-ink-950 truncate">{job.title}</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {job.candidate_count} candidate{job.candidate_count !== 1 ? 's' : ''} · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </p>
                </div>
                <ArrowRight size={14} className="text-ink-300 group-hover:text-ink-600 shrink-0 ml-4 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
