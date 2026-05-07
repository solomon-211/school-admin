import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Smartphone, GraduationCap, School,
  Users, CreditCard, LogOut, BookOpen, Calendar,
  FileText, Link2, CalendarCheck, ArrowUpCircle,
} from 'lucide-react'
import { logout, getStoredUser } from '../services/authService'

// Sidebar navigation items differ by role — teachers see a reduced set.
const adminNav = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/devices',        icon: Smartphone,      label: 'Device Verification' },
  { to: '/linking',        icon: Link2,           label: 'Linking Requests' },
  { to: '/students',       icon: GraduationCap,   label: 'Students' },
  { to: '/bulk-attendance',icon: CalendarCheck,   label: 'Attendance History' },
  { to: '/promote',        icon: ArrowUpCircle,   label: 'Promote Students' },
  { to: '/classes',        icon: School,          label: 'Classes' },
  { to: '/teachers',       icon: Users,           label: 'Teachers & Staff' },
  { to: '/fees',           icon: CreditCard,      label: 'Fee Management' },
  { to: '/fee-schedules',  icon: FileText,        label: 'Fee Schedules' },
  { to: '/terms',          icon: Calendar,        label: 'Academic Terms' },
]

const teacherNav = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students',        icon: GraduationCap,   label: 'Students' },
  { to: '/bulk-attendance', icon: CalendarCheck,   label: 'Bulk Attendance' },
  { to: '/classes',         icon: School,          label: 'Classes' },
]

export default function Layout({ children, title }) {
  const user     = getStoredUser()
  const isAdmin  = user?.role === 'admin'
  const navItems = isAdmin ? adminNav : teacherNav
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?'

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><BookOpen size={20} /></div>
          <div>
            <div className="sidebar-logo-text">SchoolAdmin</div>
            <div className="sidebar-logo-sub">{isAdmin ? 'Administration Portal' : 'Teacher Portal'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <span className="nav-icon"><Icon size={17} /></span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-user-name">{user?.firstName} {user?.lastName}</div>
              <div className="sidebar-user-role" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}
            style={{ width: '100%', color: 'var(--gray-400)', justifyContent: 'flex-start', gap: '0.5rem' }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <div className="main-content">
        {title && <div className="topbar"><span className="topbar-title">{title}</span></div>}
        <div className="page-body">{children}</div>
      </div>
    </div>
  )
}
