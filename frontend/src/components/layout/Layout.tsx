import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { statsApi } from '../../api/client'
import {
  LayoutDashboard, Briefcase, LogOut, Bot, Circle
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/jobs', label: 'Jobs', icon: Briefcase, end: false },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => statsApi.health().then(r => r.data),
    refetchInterval: 30_000,
  })

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-ink-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col bg-ink-950 text-ink-100">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-ink-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-sage-400 rounded-lg flex items-center justify-center shrink-0">
              <Bot size={14} className="text-sage-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">RecruitAI</p>
              <p className="text-[10px] text-ink-500 mt-0.5">Resume Screener</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-ink-800 text-white font-medium'
                    : 'text-ink-400 hover:text-ink-100 hover:bg-ink-900'
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-ink-800 space-y-3">
          {/* Ollama status */}
          <div className="px-3 py-2 rounded-lg bg-ink-900 flex items-center gap-2">
            <Circle
              size={7}
              className={clsx(
                'fill-current shrink-0',
                health?.ollama === 'ok' ? 'text-sage-400' : 'text-rose-400'
              )}
            />
            <span className="text-[11px] text-ink-400">
              Ollama {health?.ollama === 'ok' ? 'connected' : 'offline'}
            </span>
          </div>

          {/* User */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-sage-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ink-100 truncate">{user?.name}</p>
              <p className="text-[10px] text-ink-500 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-ink-500 hover:text-rose-400 transition-colors p-1">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
