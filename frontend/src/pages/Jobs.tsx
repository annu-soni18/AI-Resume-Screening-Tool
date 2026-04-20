import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { jobsApi, Job } from '../api/client'
import EmptyState from '../components/ui/EmptyState'
import { Briefcase, Plus, X, Trash2, ArrowRight, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface JobForm {
  title: string
  description: string
  required_skills: string
  min_experience_years: number
  min_match_score: number
}

export default function Jobs() {
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list().then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<JobForm>({
    defaultValues: { min_experience_years: 0, min_match_score: 60 },
  })

  const createMutation = useMutation({
    mutationFn: (data: JobForm) => jobsApi.create(data).then(r => r.data),
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Job created')
      setShowModal(false)
      reset()
      navigate(`/jobs/${job.id}`)
    },
    onError: () => toast.error('Failed to create job'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => jobsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); toast.success('Job removed') },
  })

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Jobs</h1>
          <p className="text-sm text-ink-400 mt-1">{jobs?.length ?? 0} active posting{jobs?.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New job
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <div key={i} className="card h-28 animate-pulse bg-ink-100" />)}
        </div>
      ) : !jobs?.length ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Create your first job posting to start screening resumes."
          action={<button onClick={() => setShowModal(true)} className="btn-primary">Create job</button>}
        />
      ) : (
        <div className="grid gap-3">
          {jobs.map(job => (
            <div
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="card px-6 py-5 hover:border-ink-200 cursor-pointer transition-all group flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h3 className="text-sm font-semibold text-ink-900 group-hover:text-ink-950">{job.title}</h3>
                  <span className="badge bg-ink-100 text-ink-500">{job.min_match_score}% min</span>
                </div>
                <p className="text-xs text-ink-400 line-clamp-2 mb-3">{job.description}</p>
                <div className="flex items-center gap-4 text-xs text-ink-400">
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {job.candidate_count} candidate{job.candidate_count !== 1 ? 's' : ''}
                  </span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                  {job.min_experience_years > 0 && (
                    <><span>·</span><span>{job.min_experience_years}+ yrs exp</span></>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); if (confirm('Delete this job?')) deleteMutation.mutate(job.id) }}
                  className="p-2 text-ink-300 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
                >
                  <Trash2 size={14} />
                </button>
                <ArrowRight size={14} className="text-ink-300 group-hover:text-ink-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
              <h2 className="text-base font-semibold text-ink-900">New job posting</h2>
              <button onClick={() => setShowModal(false)} className="text-ink-400 hover:text-ink-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Job title</label>
                <input {...register('title', { required: true })} placeholder="e.g. Senior Backend Engineer" className={clsx('input', errors.title && 'border-rose-400')} />
              </div>

              <div>
                <label className="label">Job description</label>
                <textarea
                  {...register('description', { required: true })}
                  rows={5}
                  placeholder="Paste the full job description here…"
                  className={clsx('input resize-none', errors.description && 'border-rose-400')}
                />
              </div>

              <div>
                <label className="label">Required skills <span className="normal-case text-ink-400">(comma separated)</span></label>
                <input {...register('required_skills')} placeholder="Python, FastAPI, PostgreSQL, Docker" className="input" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Min. experience (years)</label>
                  <input {...register('min_experience_years', { valueAsNumber: true })} type="number" min={0} max={20} className="input" />
                </div>
                <div>
                  <label className="label">Min. match score (%)</label>
                  <input {...register('min_match_score', { valueAsNumber: true })} type="number" min={0} max={100} className="input" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Creating…' : 'Create job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
