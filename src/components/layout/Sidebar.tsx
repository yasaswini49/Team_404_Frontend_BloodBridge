import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, ShieldCheck, GitBranch, ClipboardList, User, HeartPulse,
  Calendar, MessageSquare, ChevronLeft, Menu, Heart, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BloodDrop } from '@/components/BloodDrop'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'

interface NavItem {
  path: string
  label: string
  icon: typeof LayoutDashboard
}

const NAV: Record<UserRole, NavItem[]> = {
  admin: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/verify', label: 'Verifications', icon: ShieldCheck },
    { path: '/bridges', label: 'Bridge Assign', icon: GitBranch },
    { path: '/bridge-management', label: 'Bridge Manage', icon: Users },
    { path: '/requests', label: 'All Requests', icon: ClipboardList },
    { path: '/chatbot', label: 'AI Assistant', icon: MessageSquare },
  ],
  donor: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: User },
    { path: '/eligibility', label: 'Eligibility', icon: HeartPulse },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/chatbot', label: 'AI Assistant', icon: MessageSquare },
  ],
  patient: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: User },
    { path: '/plan', label: 'Transfusion Plan', icon: Calendar },
    { path: '/requests', label: 'My Requests', icon: ClipboardList },
    { path: '/bridge', label: 'My Bridge', icon: GitBranch },
    { path: '/chatbot', label: 'AI Assistant', icon: MessageSquare },
  ],
  hospital_coordinator: [
    { path: '/appointments', label: 'Appointments', icon: Calendar },
    { path: '/chatbot', label: 'AI Assistant', icon: MessageSquare },
  ],
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { role: authRole } = useAuth()
  const role = (authRole ?? 'donor') as UserRole
  const items = NAV[role] ?? NAV.donor

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex flex-col border-r border-border-dim bg-bg-panel/80 backdrop-blur-sm shrink-0 overflow-hidden shadow-sm"
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border-dim">
        <BloodDrop size={28} animate />
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="font-display text-xl font-normal leading-none text-ice">BloodBridge</p>
            <p className="font-body text-xs text-ice-dim mt-0.5">Caring for every hero</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {items.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon
          return (
            <NavLink key={item.path} to={item.path}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
                  active
                    ? 'bg-blood-100 text-blood-600 border border-blood-300/40 shadow-sm'
                    : 'text-ice-muted hover:text-ice hover:bg-bg-surface border border-transparent',
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && (
                  <span className="font-body text-sm font-medium truncate">{item.label}</span>
                )}
              </div>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-2 border-t border-border-dim">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu size={16} /> : <><ChevronLeft size={14} /> Collapse</>}
        </Button>
      </div>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-border-dim">
          <div className="flex items-center gap-2 text-ice-dim">
            <Heart size={12} className="text-blood-400" />
            <span className="font-body text-xs">Here when you need us</span>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
