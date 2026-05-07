import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, CheckCircle, AlertCircle, School, Users } from 'lucide-react'
import { getClasses, getStudents, getStudent, markAttendance } from '../services/adminService'
import { getStoredUser } from '../services/authService'
import Layout from '../components/Layout'

const STATUSES = [
  { value: 'present', label: 'Present', color: 'var(--success)' },
  { value: 'absent',  label: 'Absent',  color: 'var(--danger)'  },
  { value: 'late',    label: 'Late',    color: 'var(--warning)' },
  { value: 'excused', label: 'Excused', color: 'var(--gray-500)'},
]

const STATUS_BADGE = {
  present: 'badge-success',
  absent:  'badge-danger',
  late:    'badge-warning',
  excused: 'badge-info',
}

// ── Admin view: attendance history per class ──────────────────────────────────
function AdminAttendanceView({ classes }) {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(null)

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', selectedClassId],
    queryFn:  () => getStudents({ classId: selectedClassId }),
    enabled:  !!selectedClassId,
  })

  const { data: studentProfile } = useQuery({
    queryKey: ['student', selectedStudentId],
    queryFn:  () => getStudent(selectedStudentId),
    enabled:  !!selectedStudentId,
    staleTime: 0,
  })

  const activeClass = classes.find(c => c.id === selectedClassId) || null

  const selectClass = (id) => {
    setSelectedClassId(id)
    setSelectedStudentId(null)
  }

  // Attendance records for the selected student, newest first
  const records = (studentProfile?.attendance || [])
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const total   = records.length
  const present = records.filter(r => r.status === 'present').length
  const absent  = records.filter(r => r.status === 'absent').length
  const late    = records.filter(r => r.status === 'late').length
  const rate    = total ? Math.round((present / total) * 100) : 0

  const selectedStudent = students.find(s => String(s.id) === selectedStudentId)

  return (
    <>
      {/* Class selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
          Select a class
        </div>
        {classes.length === 0 ? (
          <div className="alert alert-info">No classes found.</div>
        ) : (
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            {classes.map(c => (
              <button key={c.id} type="button" onClick={() => selectClass(c.id)}
                style={{
                  padding: '0.5rem 1.125rem', borderRadius: 'var(--radius)',
                  border: `2px solid ${selectedClassId === c.id ? 'var(--primary)' : 'var(--gray-200)'}`,
                  background: selectedClassId === c.id ? 'var(--primary)' : 'var(--white)',
                  color: selectedClassId === c.id ? 'white' : 'var(--navy)',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                <School size={14} />
                {c.name}
                {selectedClassId === c.id && students.length > 0 && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.85 }}>
                    · {students.length} students
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedClassId ? (
        <div className="alert alert-info">
          <CalendarCheck size={15} className="alert-icon" />
          Choose a class to view attendance history.
        </div>
      ) : isLoading ? (
        <div className="spinner" />
      ) : students.length === 0 ? (
        <div className="alert alert-info">No students in this class.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1rem', alignItems: 'start' }}>
          {/* Student list */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Users size={14} /> {activeClass?.name}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {students.map((s, i) => (
                <button key={s.id} type="button"
                  onClick={() => setSelectedStudentId(String(s.id))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.75rem 1rem',
                    borderBottom: i < students.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    background: selectedStudentId === String(s.id) ? 'var(--primary-light)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'background 0.1s',
                  }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: selectedStudentId === String(s.id) ? 'var(--primary)' : 'var(--gray-100)',
                    color: selectedStudentId === String(s.id) ? 'white' : 'var(--gray-500)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    {s.firstName[0]}{s.lastName[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--navy)' }}>
                      {s.firstName} {s.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{s.studentCode}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Attendance history panel */}
          <div className="card">
            {!selectedStudentId ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
                <CalendarCheck size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                <p>Select a student to view their attendance history.</p>
              </div>
            ) : !studentProfile ? (
              <div className="spinner" />
            ) : (
              <>
                <div className="card-header">
                  <span className="card-title">
                    <CalendarCheck size={15} style={{ marginRight: '0.375rem' }} />
                    {selectedStudent?.firstName} {selectedStudent?.lastName} — Attendance History
                  </span>
                </div>

                {/* Summary */}
                {total > 0 && (
                  <div style={{ display: 'flex', gap: '1.5rem', padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--gray-100)', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Rate',    value: `${rate}%`,  color: 'var(--primary)' },
                      { label: 'Present', value: present,     color: 'var(--success)' },
                      { label: 'Absent',  value: absent,      color: 'var(--danger)'  },
                      { label: 'Late',    value: late,        color: 'var(--warning)' },
                      { label: 'Total',   value: total,       color: 'var(--gray-500)'},
                    ].map(item => (
                      <div key={item.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Records */}
                {records.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                    No attendance records yet for this student.
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((r, i) => (
                          <tr key={i}>
                            <td style={{ color: 'var(--gray-600)' }}>
                              {new Date(r.date).toLocaleDateString('en-GB', {
                                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </td>
                            <td>
                              <span className={`badge ${STATUS_BADGE[r.status] || 'badge-info'}`}
                                style={{ textTransform: 'capitalize' }}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── Teacher view: mark attendance ─────────────────────────────────────────────
function TeacherAttendanceView({ classes, currentUser }) {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [date, setDate]     = useState(new Date().toISOString().split('T')[0])
  const [statuses, setStatuses] = useState({})
  const [saving, setSaving]     = useState({})
  const [saved, setSaved]       = useState({})
  const [msg, setMsg] = useState({ type: '', text: '' })

  const visibleClasses = classes.filter(c =>
    c.teachers?.some(t =>
      t.teacher?.id === currentUser?.id ||
      String(t.teacher?.id) === String(currentUser?.id)
    )
  )

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', selectedClassId],
    queryFn:  () => getStudents({ classId: selectedClassId }),
    enabled:  !!selectedClassId,
  })

  const activeClass = classes.find(c => c.id === selectedClassId) || null

  const selectClass = (id) => {
    setSelectedClassId(id)
    setStatuses({})
    setSaving({})
    setSaved({})
    setMsg({ type: '', text: '' })
  }

  const getStatus = (sid) => statuses[sid] || 'present'

  const handleStatusClick = async (sid, status) => {
    if (saving[sid]) return
    setStatuses(p => ({ ...p, [sid]: status }))
    setSaving(p => ({ ...p, [sid]: true }))
    setSaved(p => ({ ...p, [sid]: false }))
    try {
      await markAttendance(sid, [{ date, status }])
      setSaved(p => ({ ...p, [sid]: true }))
      setTimeout(() => setSaved(p => ({ ...p, [sid]: false })), 2000)
    } catch (e) {
      setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to save.' })
      setStatuses(p => ({ ...p, [sid]: getStatus(sid) }))
    } finally {
      setSaving(p => ({ ...p, [sid]: false }))
    }
  }

  const handleMarkAll = async (status) => {
    if (!students.length) return
    setMsg({ type: '', text: '' })
    const ns = {}; students.forEach(s => { ns[String(s.id)] = status }); setStatuses(ns)
    const nv = {}; students.forEach(s => { nv[String(s.id)] = true });  setSaving(nv)
    try {
      await Promise.all(students.map(s => markAttendance(String(s.id), [{ date, status }])))
      const sv = {}; students.forEach(s => { sv[String(s.id)] = true }); setSaved(sv)
      setMsg({ type: 'success', text: `All ${students.length} students marked as ${status}.` })
      setTimeout(() => setSaved({}), 2000)
    } catch (e) {
      setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' })
    } finally { setSaving({}) }
  }

  const counts = STATUSES.reduce((acc, st) => {
    acc[st.value] = students.filter(s => getStatus(String(s.id)) === st.value).length
    return acc
  }, {})

  return (
    <>
      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1rem' }}>
          {msg.type === 'success' ? <CheckCircle size={15} className="alert-icon" /> : <AlertCircle size={15} className="alert-icon" />}
          {msg.text}
        </div>
      )}

      {/* Class selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
          Select a class
        </div>
        {visibleClasses.length === 0 ? (
          <div className="alert alert-info">You have not been assigned to any classes yet.</div>
        ) : (
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            {visibleClasses.map(c => (
              <button key={c.id} type="button" onClick={() => selectClass(c.id)}
                style={{
                  padding: '0.5rem 1.125rem', borderRadius: 'var(--radius)',
                  border: `2px solid ${selectedClassId === c.id ? 'var(--primary)' : 'var(--gray-200)'}`,
                  background: selectedClassId === c.id ? 'var(--primary)' : 'var(--white)',
                  color: selectedClassId === c.id ? 'white' : 'var(--navy)',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                <School size={14} />
                {c.name}
                {selectedClassId === c.id && students.length > 0 && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.85 }}>
                    · {students.length} students
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedClassId ? (
        <div className="alert alert-info">
          <CalendarCheck size={15} className="alert-icon" />
          Choose a class above to start marking attendance.
        </div>
      ) : isLoading ? (
        <div className="spinner" />
      ) : students.length === 0 ? (
        <div className="alert alert-info">No students found in this class.</div>
      ) : (
        <>
          {/* Date + mark-all + summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Date *</label>
              <input type="date" className="form-input" style={{ width: 180 }}
                value={date}
                onChange={(e) => { setDate(e.target.value); setStatuses({}); setSaved({}) }}
                required />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.375rem', fontWeight: 600 }}>Mark all as</div>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {STATUSES.map(st => (
                  <button key={st.value} type="button"
                    style={{ padding: '0.3rem 0.75rem', borderRadius: 20, border: `1.5px solid ${st.color}`, background: 'transparent', color: st.color, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', textTransform: 'capitalize' }}
                    onClick={() => handleMarkAll(st.value)}>
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
              {STATUSES.map(st => (
                <div key={st.value} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: st.color, lineHeight: 1 }}>{counts[st.value]}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'capitalize' }}>{st.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Student register */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Users size={15} style={{ marginRight: '0.375rem' }} />{activeClass?.name} — {students.length} student{students.length !== 1 ? 's' : ''}</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>Saves automatically when you click a status</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Student</th><th>Code</th><th>Attendance</th></tr></thead>
                <tbody>
                  {students.map(s => {
                    const sid = String(s.id)
                    const current  = getStatus(sid)
                    const isSaving = !!saving[sid]
                    const isSaved  = !!saved[sid]
                    return (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                              {s.firstName[0]}{s.lastName[0]}
                            </div>
                            <div>
                              <span style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</span>
                              {isSaving && <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginLeft: '0.5rem' }}>saving…</span>}
                              {isSaved && !isSaving && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--success)', marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <CheckCircle size={11} /> saved
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td><code style={{ fontSize: '0.8125rem', background: 'var(--gray-100)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>{s.studentCode}</code></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                            {STATUSES.map(st => (
                              <button key={st.value} type="button" disabled={isSaving}
                                onClick={() => handleStatusClick(sid, st.value)}
                                style={{
                                  padding: '0.25rem 0.75rem', borderRadius: 20,
                                  border: `1.5px solid ${current === st.value ? st.color : 'var(--gray-200)'}`,
                                  background: current === st.value ? st.color : 'transparent',
                                  color: current === st.value ? 'white' : 'var(--gray-500)',
                                  fontSize: '0.8125rem', fontWeight: current === st.value ? 600 : 400,
                                  cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1,
                                  transition: 'all 0.12s', textTransform: 'capitalize',
                                }}>
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BulkAttendancePage() {
  const currentUser = getStoredUser()
  const isTeacher   = currentUser?.role === 'teacher'

  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses })

  return (
    <Layout title={isTeacher ? 'Bulk Attendance' : 'Attendance History'}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isTeacher ? 'Bulk Attendance' : 'Attendance History'}</h1>
          <p className="page-sub">
            {isTeacher
              ? 'Select one of your classes, then mark each student.'
              : 'View attendance records for any class and student.'}
          </p>
        </div>
      </div>

      {isTeacher
        ? <TeacherAttendanceView classes={classes} currentUser={currentUser} />
        : <AdminAttendanceView   classes={classes} />
      }
    </Layout>
  )
}
