import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Users, School, CreditCard,
  Smartphone, TrendingUp, AlertTriangle, ArrowRight,
  BookOpen, CalendarCheck, Clock,
} from 'lucide-react'
import { getDashboardStats, getClasses } from '../services/adminService'
import { getStoredUser } from '../services/authService'
import Layout from '../components/Layout'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function TeacherDashboard({ user }) {
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses })

  // Filter to only classes this teacher is assigned to
  const myClasses = classes.filter(c =>
    c.teachers?.some(t =>
      t.teacher?.id === user?.id ||
      String(t.teacher?.id) === String(user?.id)
    )
  )

  // Get today's day name and build upcoming slots across all assigned classes
  const todayName = DAYS[new Date().getDay()]
  const now       = new Date()
  const nowTime   = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // Collect all timetable slots for today that belong to this teacher's subjects
  const todaySlots = myClasses.flatMap(cls => {
    const mySubjects = new Set(
      (cls.teachers || [])
        .filter(t => t.teacher?.id === user?.id || String(t.teacher?.id) === String(user?.id))
        .map(t => t.subject?.toLowerCase())
    )
    return (cls.timetable || [])
      .filter(s => s.day === todayName && mySubjects.has(s.subject?.toLowerCase()))
      .map(s => ({ ...s, className: cls.name, classId: cls.id }))
  }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

  const upcoming = todaySlots.filter(s => (s.startTime || '') >= nowTime)
  const past     = todaySlots.filter(s => (s.startTime || '') < nowTime)

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.firstName} {user?.lastName}</h1>
          <p className="page-sub">Teacher portal — manage your students' grades and attendance.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-orange"><GraduationCap size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Your Role</div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>Teacher</div>
            <div className="stat-sub">Staff account</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-navy"><School size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Classes Assigned</div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>{myClasses.length}</div>
            <div className="stat-sub">{myClasses.map(c => c.name).join(', ') || 'None yet'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success"><CalendarCheck size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Today's Classes</div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>{todaySlots.length}</div>
            <div className="stat-sub">{upcoming.length} upcoming · {past.length} done</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Today's schedule */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Clock size={15} /> Today's Schedule — {todayName}</span>
          </div>
          <div className="card-body" style={{ padding: '0.5rem 0' }}>
            {todaySlots.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                No classes scheduled for today.
              </div>
            ) : (
              todaySlots.map((s, i) => {
                const isDone = (s.startTime || '') < nowTime
                return (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '3.5rem 1fr auto',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 1.25rem',
                    borderBottom: i < todaySlots.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    opacity: isDone ? 0.5 : 1,
                  }}>
                    {/* Time */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: isDone ? 'var(--gray-400)' : 'var(--primary)' }}>
                        {s.startTime}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                        {s.endTime}
                      </div>
                    </div>
                    {/* Subject + class */}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--navy)' }}>{s.subject}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {s.className}{s.room ? ` · ${s.room}` : ''}
                      </div>
                    </div>
                    {/* Status pill */}
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem',
                      borderRadius: 20,
                      background: isDone ? 'var(--gray-100)' : 'var(--primary-light)',
                      color: isDone ? 'var(--gray-400)' : 'var(--primary)',
                      whiteSpace: 'nowrap',
                    }}>
                      {isDone ? 'Done' : 'Upcoming'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Quick Actions</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/students" className="btn btn-primary" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={16} /> Update Student Grades
              </span>
              <ArrowRight size={15} />
            </Link>
            <Link to="/bulk-attendance" className="btn btn-navy" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarCheck size={16} /> Mark Attendance
              </span>
              <ArrowRight size={15} />
            </Link>
            <Link to="/classes" className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <School size={16} /> View Classes
              </span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* My classes summary */}
          {myClasses.length > 0 && (
            <div style={{ borderTop: '1px solid var(--gray-100)', padding: '1rem 1.5rem 0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Your Classes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {myClasses.map(c => {
                  const mySubjects = (c.teachers || [])
                    .filter(t => t.teacher?.id === user?.id || String(t.teacher?.id) === String(user?.id))
                    .map(t => t.subject)
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--navy)' }}>{c.name}</span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {mySubjects.map(s => (
                          <span key={s} style={{ fontSize: '0.7rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 600 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
  })

  const feeChartData = stats ? [
    { name: 'Collected', value: stats.fees.totalCollected, color: '#f97316' },
    { name: 'Refunded',  value: stats.fees.totalRefunded,  color: '#0f172a' },
  ] : []

  const statCards = stats ? [
    { label: 'Total Students',  value: stats.totalStudents,  icon: GraduationCap, variant: 'orange' },
    { label: 'Teachers',        value: stats.totalTeachers,  icon: Users,         variant: 'navy' },
    { label: 'Classes',         value: stats.totalClasses,   icon: School,        variant: 'info' },
    { label: 'Parents',         value: stats.totalParents,   icon: Users,         variant: 'success' },
    { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: TrendingUp, variant: 'success' },
    { label: 'Pending Devices', value: stats.pendingDeviceVerifications, icon: Smartphone,
      variant: stats.pendingDeviceVerifications > 0 ? 'danger' : 'navy' },
  ] : []

  return (
    <Layout title="Dashboard">
      {isLoading ? <div className="spinner" /> : (
        <>
          {stats?.pendingDeviceVerifications > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
              <AlertTriangle size={16} className="alert-icon" />
              <div>
                <strong>{stats.pendingDeviceVerifications} device(s)</strong> are pending verification.{' '}
                <Link to="/devices" style={{ fontWeight: 600, textDecoration: 'underline' }}>Review now</Link>
              </div>
            </div>
          )}

          <div className="stats-grid">
            {statCards.map((s) => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon stat-icon-${s.variant}`}><s.icon size={20} /></div>
                <div className="stat-content">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title"><CreditCard size={16} /> Fee Summary</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Total Collected</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {stats?.fees.totalCollected.toLocaleString()} RWF
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Total Refunded</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)' }}>
                      {stats?.fees.totalRefunded.toLocaleString()} RWF
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={feeChartData} barSize={48}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v) => [`${v.toLocaleString()} RWF`]}
                      contentStyle={{ borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 13 }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {feeChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Quick Actions</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { to: '/devices',  label: `Verify Pending Devices (${stats?.pendingDeviceVerifications || 0})`, icon: Smartphone, variant: 'btn-primary' },
                  { to: '/students', label: 'Manage Students',     icon: GraduationCap, variant: 'btn-navy' },
                  { to: '/classes',  label: 'Manage Classes',      icon: School,        variant: 'btn-outline' },
                  { to: '/fees',     label: 'Review Fee Requests', icon: CreditCard,    variant: 'btn-outline' },
                ].map(({ to, label, icon: Icon, variant }) => (
                  <Link key={to} to={to} className={`btn ${variant}`} style={{ justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon size={16} /> {label}
                    </span>
                    <ArrowRight size={15} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}

export default function DashboardPage() {
  const user = getStoredUser()
  if (user?.role === 'teacher') return <TeacherDashboard user={user} />
  return <AdminDashboard />
}
