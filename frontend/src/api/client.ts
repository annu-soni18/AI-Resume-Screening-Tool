/// <reference types="vite/client" />
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User { id: number; name: string; email: string; role: string; created_at: string }
export interface Job {
  id: number; title: string; description: string; required_skills: string;
  min_experience_years: number; min_match_score: number; is_active: boolean;
  created_at: string; candidate_count: number;
}
export interface Candidate {
  id: number; name: string; email: string; phone: string; filename: string;
  file_path: string;
  match_score: number; ai_summary: string; matching_skills: string;
  missing_skills: string; green_flags: string; red_flags: string;
  years_experience: number; status: string; screening_error: string;
  job_id: number; created_at: string; screened_at: string | null;
}
export interface Stats {
  total_jobs: number; total_candidates: number; shortlisted: number;
  avg_match_score: number; pending_screening: number;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),
  login: (email: string, password: string) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    return api.post<{ access_token: string; token_type: string; user: User }>('/api/auth/login', form)
  },
  me: () => api.get<User>('/api/auth/me'),
}

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobsApi = {
  list: () => api.get<Job[]>('/api/jobs'),
  get: (id: number) => api.get<Job>(`/api/jobs/${id}`),
  create: (data: Partial<Job>) => api.post<Job>('/api/jobs', data),
  delete: (id: number) => api.delete(`/api/jobs/${id}`),
}

// ── Candidates ────────────────────────────────────────────────────────────────
export const candidatesApi = {
  upload: (jobId: number, files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    return api.post(`/api/candidates/upload/${jobId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list: (jobId: number, params?: { status?: string; min_score?: number }) =>
    api.get<Candidate[]>(`/api/candidates/job/${jobId}`, { params }),
  get: (id: number) => api.get<Candidate>(`/api/candidates/${id}`),
  updateStatus: (id: number, status: string) =>
    api.patch<Candidate>(`/api/candidates/${id}/status`, { status }),
  bulkStatus: (ids: number[], status: string) =>
    api.post('/api/candidates/bulk-status', { candidate_ids: ids, status }),
  delete: (id: number) => api.delete(`/api/candidates/${id}`),
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export const statsApi = {
  get: () => api.get<Stats>('/api/stats'),
  health: () => api.get<{ api: string; ollama: string }>('/api/stats/health'),
}
