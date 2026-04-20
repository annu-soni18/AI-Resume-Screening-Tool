import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi, candidatesApi, Candidate } from '../api/client'
import ScoreBadge from '../components/ui/ScoreBadge'
import StatusBadge from '../components/ui/StatusBadge'
import Dropzone from '../components/ui/Dropzone'
import EmptyState from '../components/ui/EmptyState'
import {
  ArrowLeft, Upload, X, Users, ChevronDown, Check, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_OPTIONS = ['pending', 'shortlisted', 'rejected', 'interviewing', 'hired']

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const jobId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [showUpload, setShowUpload] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterScore, setFilterScore] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId).then(r => r.data),
  })

  const { data: candidates, isLoading, refetch } = useQuery({
    queryKey: ['candidates', jobId, filterStatus, filterScore],
    queryFn: () => candidatesApi.list(jobId, {
      status: filterStatus || undefined,
      min_score: filterScore || undefined,
    }).then(r => r.data),
    refetchInterval: 8_000,
  })

  const uploadMutation = useMutation({
    mutationFn: () => candidatesApi.upload(jobId, files),
    onSuccess: (r) => {
      toast.success(r.data.message)
      setFiles([])
      setShowUpload(false)
      setTimeout(() => refetch(), 2000)
    },
    onError: () => toast.error('Upload failed'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => candidatesApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates', jobId] }),
  })

  const bulkMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: string }) => candidatesApi.bulkStatus(ids, status),
    onSuccess: () => {
      toast.success(`Updated ${selected.size} candidates`)
      setSelected(new Set())
      setBulkStatus('')
      qc.invalidateQueries({ queryKey: ['candidates', jobId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => candidatesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates', jobId] }),
  })

  const handleUpload = async () => {
    if (!files.length) return toast.error('Add at least one file')
    setUploading(true)
    await uploadMutation.mutateAsync()
    setUploading(false)
  }

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleAll = () => {
    if (!candidates) return
    setSelected(selected.size === candidates.length ? new Set() : new Set(candidates.map(c => c.id)))
  }

  const handleBulkApply = () => {
    if (!bulkStatus || !selected.size) return
    bulkMutation.mutate({ ids: Array.from(selected), status: bulkStatus })
  }

  const screening = candidates?.filter(c => c.status === 'screening').length ?? 0

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <button onClick={() => navigate('/jobs')} className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 transition-colors mb-3">
            <ArrowLeft size={13} /> All jobs
          </button>
          <h1 className="text-2xl font-semibold text-ink-900">{job?.title}</h1>
          <p className="text-sm text-ink-400 mt-1">
            {candidates?.length ?? 0} candidates · min score {job?.min_match_score}%
          </p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="btn-primary flex items-center gap-2">
          <Upload size={14} /> Upload resumes
        </button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="card p-6 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink-800">Upload resumes</h3>
            <button onClick={() => { setShowUpload(false); setFiles([]) }} className="text-ink-400 hover:text-ink-700"><X size={16} /></button>
          </div>
          <Dropzone files={files} onChange={setFiles} />
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => { setShowUpload(false); setFiles([]) }} className="btn-secondary">Cancel</button>
            <button onClick={handleUpload} disabled={uploading || !files.length} className="btn-primary">
              {uploading ? 'Uploading…' : `Screen ${files.length} resume${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Screening banner */}
      {screening > 0 && (
        <div className="mb-4 flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-xs text-amber-800">
            <span className="font-semibold">{screening}</span> resume{screening > 1 ? 's' : ''} being analysed by Ollama…
          </p>
        </div>
      )}

      {/* Filters + bulk actions */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input !w-auto !py-2 !text-xs"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        <select
          value={filterScore}
          onChange={e => setFilterScore(Number(e.target.value))}
          className="input !w-auto !py-2 !text-xs"
        >
          <option value={0}>Any score</option>
          <option value={40}>40%+</option>
          <option value={60}>60%+</option>
          <option value={75}>75%+</option>
          <option value={85}>85%+</option>
        </select>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-ink-500">{selected.size} selected</span>
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="input !w-auto !py-2 !text-xs"
            >
              <option value="">Set status…</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <button onClick={handleBulkApply} disabled={!bulkStatus} className="btn-primary !py-2 !text-xs flex items-center gap-1">
              <Check size={12} /> Apply
            </button>
          </div>
        )}
      </div>

      {/* Candidates table */}
      {isLoading ? (
        <div className="card divide-y divide-ink-50">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="w-4 h-4 bg-ink-100 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-ink-100 rounded w-32" />
                <div className="h-2.5 bg-ink-50 rounded w-48" />
              </div>
              <div className="w-20 h-5 bg-ink-100 rounded" />
            </div>
          ))}
        </div>
      ) : !candidates?.length ? (
        <EmptyState
          icon={Users}
          title="No candidates yet"
          description="Upload some resumes and Ollama will screen them automatically."
          action={<button onClick={() => setShowUpload(true)} className="btn-primary">Upload resumes</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          {/* Table head */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-ink-100 bg-ink-50">
            <input
              type="checkbox"
              checked={selected.size === candidates.length && candidates.length > 0}
              onChange={toggleAll}
              className="rounded"
            />
            <span className="text-xs font-medium text-ink-500 flex-1">Candidate</span>
            <span className="text-xs font-medium text-ink-500 w-32 text-center">Match</span>
            <span className="text-xs font-medium text-ink-500 w-24 text-center">Status</span>
            <span className="text-xs font-medium text-ink-500 w-24 text-center">Experience</span>
            <span className="w-16" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-ink-50">
            {candidates.map((c: Candidate) => (
              <div
                key={c.id}
                className={clsx(
                  'flex items-center gap-4 px-5 py-3.5 hover:bg-ink-50 transition-colors group',
                  selected.has(c.id) && 'bg-sage-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  onClick={e => e.stopPropagation()}
                  className="rounded shrink-0"
                />

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/jobs/${jobId}/candidates/${c.id}`)}
                >
                  <p className="text-sm font-medium text-ink-800 truncate group-hover:text-ink-950">{c.name}</p>
                  <p className="text-xs text-ink-400 truncate mt-0.5">{c.email || c.filename}</p>
                </div>

                <div className="w-32">
                  {c.status === 'screening' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-xs text-amber-600">Analysing</span>
                    </div>
                  ) : (
                    <ScoreBadge score={c.match_score} />
                  )}
                </div>

                <div className="w-24 flex justify-center">
                  <StatusBadge status={c.status} />
                </div>

                <div className="w-24 text-center">
                  <span className="text-xs text-ink-500">{c.years_experience > 0 ? `${c.years_experience} yrs` : '—'}</span>
                </div>

                <div className="w-16 flex items-center justify-end gap-1">
                  <select
                    value={c.status}
                    onChange={e => statusMutation.mutate({ id: c.id, status: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    className="text-[10px] text-ink-400 bg-transparent border-none cursor-pointer outline-none hover:text-ink-700"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={e => { e.stopPropagation(); if (confirm('Delete candidate?')) deleteMutation.mutate(c.id) }}
                    className="p-1 text-ink-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
