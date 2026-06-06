import { useLocation } from 'react-router-dom'
import { LogOut, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/verify': 'HPLC Verifications',
  '/bridges': 'Bridge Assignment',
  '/requests': 'Transfusion Requests',
  '/profile': 'Profile',
  '/eligibility': 'Eligibility Screening',
  '/schedule': 'Donation Schedule',
  '/bridge': 'My Bridge',
  '/appointments': 'Hospital Appointments',
  '/chatbot': 'AI Assistant',
  '/login': 'Sign In',
  '/register': 'Register',
}

export function TopBar() {
  const { auth, logout, role } = useAuth()
  const location = useLocation()
  const title = TITLES[location.pathname] ?? 'BloodBridge'

  return (
    <header className="flex items-center justify-between border-b border-border-dim bg-bg-deep/80 backdrop-blur-md px-6 py-4 shrink-0">
      <div>
        <h1 className="font-display text-3xl font-light tracking-tight text-ice">{title}</h1>
        {auth && (
          <p className="font-data text-[10px] uppercase tracking-widest text-ice-dim mt-0.5">
            {auth.full_name} · {role?.replace('_', ' ')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="blood" className="hidden sm:inline-flex">
          <span className="w-1.5 h-1.5 rounded-full bg-blood-400 animate-pulse-blood mr-1.5 inline-block" />
          Live
        </Badge>
        <Button variant="ghost" size="sm" aria-label="Notifications">
          <Bell size={16} />
        </Button>
        <Button variant="secondary" size="sm" onClick={logout}>
          <LogOut size={14} />
          Sign Out
        </Button>
      </div>
    </header>
  )
}
