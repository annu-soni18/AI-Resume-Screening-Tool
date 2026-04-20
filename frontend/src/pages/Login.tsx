import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { Bot, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'

type Mode = 'login' | 'register'

interface FormData {
  name?: string
  email: string
  password: string
}

export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const { register: reg, handleSubmit, formState: { errors }, reset } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(data.email, data.password)
      } else {
        await register(data.name!, data.email, data.password)
      }
      navigate('/')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: Mode) => { setMode(m); reset() }

  return (
    <div className="min-h-screen bg-ink-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 bg-ink-900 border-r border-ink-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-sage-400 rounded-xl flex items-center justify-center">
            <Bot size={16} className="text-sage-900" />
          </div>
          <span className="text-white font-semibold text-sm">RecruitAI</span>
        </div>

        <div>
          <div className="flex items-center justify-center h-screen px-8">
            <blockquote className="max-w-md text-center space-y-4">
              
              <h1 className="text-3xl font-bold text-white leading-tight">
                Powered by AI.<br />
                Built for Recruiters.
              </h1>

              <p className="text-sm text-ink-400 leading-relaxed">
                RecruitAI analyzes resumes, extracts skills, and ranks candidates 
                based on job fit.
              </p>

              <p className="text-sm text-ink-400 leading-relaxed">
                Make data-driven hiring decisions with confidence and turn hours 
                of screening into minutes.
              </p>

            </blockquote>
          </div>
          
          {/* <div className="mt-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sage-600 flex items-center justify-center text-white text-sm font-semibold">A</div>
            <div>
              <p className="text-sm font-medium text-white">Annu Soni</p>
              <p className="text-xs text-ink-500">Senior Recruiter, TechCorp</p>
            </div>
          </div> */}
        </div>
        

        {/* <div className="space-y-3">
          {[
            { n: '247', label: 'Resumes screened' },
            { n: '< 1hr', label: 'Average screening time' },
            { n: '100%', label: 'Local & private' },
          ].map(({ n, label }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-ink-800 last:border-0">
              <span className="text-xs text-ink-500">{label}</span>
              <span className="text-sm font-semibold text-sage-400 font-mono">{n}</span>
            </div>
          ))}
        </div> */}
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-sage-400 rounded-xl flex items-center justify-center">
              <Bot size={16} className="text-sage-900" />
            </div>
            <span className="text-white font-semibold text-sm">RecruitAI</span>
          </div>

          <h1 className="text-2xl font-semibold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-ink-400 mb-8">
            {mode === 'login' ? 'Sign in to your workspace' : 'Start screening smarter'}
          </p>

          {/* Tabs */}
          <div className="flex bg-ink-800 rounded-xl p-1 mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                  mode === m ? 'bg-ink-600 text-white' : 'text-ink-400 hover:text-ink-200'
                )}
              >
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-ink-400 mb-1.5">Full name</label>
                <input
                  {...reg('name', { required: mode === 'register' })}
                  placeholder="Priya Sharma"
                  className={clsx(
                    'w-full bg-ink-800 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-ink-600 focus:outline-none focus:border-ink-500 transition-colors',
                    errors.name ? 'border-rose-600' : 'border-ink-700'
                  )}
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-ink-400 mb-1.5">Email</label>
              <input
                {...reg('email', { required: true })}
                type="email"
                placeholder="you@company.com"
                className={clsx(
                  'w-full bg-ink-800 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-ink-600 focus:outline-none focus:border-ink-500 transition-colors',
                  errors.email ? 'border-rose-600' : 'border-ink-700'
                )}
              />
            </div>

            <div>
              <label className="block text-xs text-ink-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...reg('password', { required: true, minLength: 6 })}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={clsx(
                    'w-full bg-ink-800 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-ink-600 focus:outline-none focus:border-ink-500 transition-colors pr-10',
                    errors.password ? 'border-rose-600' : 'border-ink-700'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage-500 hover:bg-sage-600 active:bg-sage-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
