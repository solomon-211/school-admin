import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, BookOpen, CalendarCheck, Search, Link2, School, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'
import { getStudents, getStudent, createStudent, updateGrades, markAttendance, linkUserAccount, updateStudent, getClasses, getCurrentTerm } from '../services/adminService'
import { getStoredUser } from '../services/authService'
import Layout from '../components/Layout'

// Status options for attendance
const STATUSES = ['present', 'absent', 'late', 'excused']
const STATUS_COLORS = { present: 'var(--success)', absent: 'var(--danger)', late: 'var(--warning)', excused: 'var(--gray-500)' }

export default function StudentsPage() {
  const qc          = useQueryClient()
  const currentUser = getStoredUser()
  const isTeacher   = currentUser?.role === 'teacher'

  // Teacher picks a class first — students are then fetched for that class only
  // Admin also picks a class to filter students — defaults to showing all if none selected
  const [selectedClassId, setSelectedClassId] = useState('')

  // Always fetch classes for the class selector
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses })

  // Fetch students filtered by selected class (both roles)
  // For teachers: disabled until a class is selected
  // For admins: fetches all students when no class is selected
  const { data: students, isLoading } = useQuery({
    queryKey: ['students', selectedClassId],
    queryFn:  () => getStudents(selectedClassId ? { classId: selectedClassId } : {}),
    enabled:  !isTeacher || !!selectedClassId,
  })

  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showGrades, setShowGrades] = useState(null)
  const [showAttend, setShowAttend] = useState(null)   // single student (admin)
  const [showBulkAttend, setShowBulkAttend] = useState(null) // class attendance sheet (teacher)
  const [showLink,   setShowLink]   = useState(null)
  const [showClass,  setShowClass]  = useState(null)   // admin assign-class modal
  const [msg, setMsg] = useState({ type: '', text: '' })

  const [newStudent, setNewStudent] = useState({ studentCode: '', firstName: '', lastName: '', gender: 'male', dateOfBirth: '' })
  const [gradeForm, setGradeForm] = useState({ subject: '', score: '', grade: 'A', term: '' })
  const [linkEmail,  setLinkEmail]  = useState('')
  const [assignClassId, setAssignClassId] = useState('')  // admin assign-class modal selection

  // Bulk attendance state — { date, rows: [{ studentId, name, status }] }
  const [bulkDate, setBulkDate]   = useState(new Date().toISOString().split('T')[0])
  const [bulkRows, setBulkRows]   = useState([])

  // Fetch full student profile (includes grades + attendance) when grades or attendance modal is open
  // Use String() to ensure the id is a plain string for consistent query key matching
  const activeStudentId = showGrades?.id ? String(showGrades.id) : showAttend?.id ? String(showAttend.id) : null
  const { data: studentProfile } = useQuery({
    queryKey: ['student', activeStudentId],
    queryFn:  () => getStudent(activeStudentId),
    enabled:  !!activeStudentId,
    staleTime: 0,
  })

  // Fetch the current academic term to pre-fill the term field
  const { data: currentTerm } = useQuery({
    queryKey: ['currentTerm'],
    queryFn:  getCurrentTerm,
    staleTime: 5 * 60 * 1000,
  })
  const createMut = useMutation({
    mutationFn: (data) => createStudent(data),
    onSuccess: () => {
      qc.invalidateQueries(['students', selectedClassId])
      setShowCreate(false)
      setMsg({ type: 'success', text: 'Student created successfully.' })
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to create student.' }),
  })

  const gradesMut = useMutation({
    mutationFn: ({ id, grades }) => updateGrades(id, grades),
    onSuccess: () => {
      // Invalidate using the same string key used by the query
      qc.invalidateQueries({ queryKey: ['student', String(showGrades?.id)] })
      setMsg({ type: 'success', text: 'Grade saved.' })
      // Reset score/grade but keep subject and term for quick multi-entry
      setGradeForm(p => ({ ...p, score: '', grade: 'A' }))
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  // Bulk attendance — fires one request per student in parallel
  const bulkAttendMut = useMutation({
    mutationFn: async (rows) => {
      await Promise.all(
        rows.map(r => markAttendance(r.studentId, [{ date: bulkDate, status: r.status }]))
      )
    },
    onSuccess: () => {
      qc.invalidateQueries(['students'])
      setShowBulkAttend(null)
      setMsg({ type: 'success', text: `Attendance saved for ${bulkRows.length} students.` })
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to save attendance.' }),
  })

  const linkMut = useMutation({
    mutationFn: ({ id, email }) => linkUserAccount(id, email),
    onSuccess: () => {
      qc.invalidateQueries(['students'])
      setShowLink(null); setLinkEmail('')
      setMsg({ type: 'success', text: 'Account linked. The student can now log in and see their data.' })
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to link account.' }),
  })

  const classMut = useMutation({
    mutationFn: ({ id, classId }) => updateStudent(id, { class: classId }),
    onSuccess: () => {
      qc.invalidateQueries(['students', selectedClassId])
      setShowClass(null)
      setMsg({ type: 'success', text: 'Student assigned to class.' })
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  // ── Derived data ───────────────────────────────────────────────────────────
  const filtered = (students || []).filter(s =>
    `${s.firstName} ${s.lastName} ${s.studentCode}`.toLowerCase().includes(search.toLowerCase())
  )

  // Classes the teacher is assigned to (filtered from all classes)
  const teacherClasses = isTeacher
    ? classes.filter(c =>
        c.teachers?.some(t =>
          t.teacher?.id === currentUser?.id ||
          String(t.teacher?.id) === String(currentUser?.id)
        )
      )
    : []

  // Admin sees all classes; teacher sees only their assigned classes
  const visibleClasses = isTeacher ? teacherClasses : classes

  // The currently selected class object (for display)
  const activeClass = classes.find(c => c.id === selectedClassId) || null

  // Open bulk attendance for the currently selected class
  const openBulkAttend = () => {
    if (!activeClass) return
    setBulkRows((students || []).map(s => ({
      studentId: s.id,
      name: `${s.firstName} ${s.lastName}`,
      status: 'present',
    })))
    setBulkDate(new Date().toISOString().split('T')[0])
    setShowBulkAttend(activeClass.name)
  }

  const updateBulkRow = (studentId, status) => {
    setBulkRows(p => p.map(r => r.studentId === studentId ? { ...r, status } : r))
  }

  const setAllStatus = (status) => setBulkRows(p => p.map(r => ({ ...r, status })))

  return (
    <Layout title="Students">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-sub">
            {isTeacher
              ? 'Select a class to view students and mark attendance.'
              : 'Select a class to view and manage its students.'}
          </p>
        </div>
      </div>

      {/* ── Class selector (both roles) ──────────────────────────────────────── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
          Select a class
        </div>

        {visibleClasses.length === 0 ? (
          <div className="alert alert-info">
            {isTeacher
              ? 'You have not been assigned to any classes yet. Ask an admin to assign you to a class.'
              : 'No classes found. Create a class first from the Classes page.'}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            {/* Admin gets an "All Students" pill to see everyone */}
            {!isTeacher && (
              <button
                onClick={() => { setSelectedClassId(''); setSearch('') }}
                style={{
                  padding: '0.5rem 1.125rem',
                  borderRadius: 'var(--radius)',
                  border: `2px solid ${selectedClassId === '' ? 'var(--primary)' : 'var(--gray-200)'}`,
                  background: selectedClassId === '' ? 'var(--primary)' : 'var(--white)',
                  color: selectedClassId === '' ? 'white' : 'var(--navy)',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                All Students
                {selectedClassId === '' && (students || []).length > 0 && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.85 }}>
                    · {filtered.length}
                  </span>
                )}
              </button>
            )}
            {visibleClasses.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedClassId(c.id); setSearch('') }}
                style={{
                  padding: '0.5rem 1.125rem',
                  borderRadius: 'var(--radius)',
                  border: `2px solid ${selectedClassId === c.id ? 'var(--primary)' : 'var(--gray-200)'}`,
                  background: selectedClassId === c.id ? 'var(--primary)' : 'var(--white)',
                  color: selectedClassId === c.id ? 'white' : 'var(--navy)',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                <School size={14} />
                {c.name}
                {selectedClassId === c.id && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.85 }}>
                    · {filtered.length} students
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons below the class pills */}
        {selectedClassId && (
          <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
            {/* Admin: Add Student to this class */}
            {!isTeacher && (
              <button className="btn btn-primary" onClick={() => {
                setNewStudent({ studentCode: '', firstName: '', lastName: '', gender: 'male', dateOfBirth: '', class: selectedClassId })
                setShowCreate(true)
              }}>
                <Plus size={15} /> Add Student to {activeClass?.name}
              </button>
            )}
            {/* Teacher: Take Attendance */}
            {isTeacher && (students || []).length > 0 && (
              <button className="btn btn-primary" onClick={openBulkAttend}>
                <CalendarCheck size={15} /> Take Attendance — {activeClass?.name}
              </button>
            )}
          </div>
        )}
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1rem' }}>
          {msg.type === 'success' ? <CheckCircle size={16} className="alert-icon" /> : <AlertCircle size={16} className="alert-icon" />}
          {msg.text}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {selectedClassId
              ? `${activeClass?.name || 'Class'} — ${filtered.length} student${filtered.length !== 1 ? 's' : ''}`
              : isTeacher
                ? 'Select a class above to view students'
                : `All Students (${filtered.length})`}
          </span>
          {(!isTeacher || selectedClassId) && (
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: '2rem', width: 220 }}
                placeholder="Search students…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {isTeacher && !selectedClassId ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
            <School size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.9375rem' }}>Choose a class above to see its students.</p>
          </div>
        ) : isLoading ? (
          <div className="spinner" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Code</th>
                  <th>Gender</th>
                  <th>Class</th>
                  {isTeacher && <th>Grades</th>}
                  {!isTeacher && <th>Fee Balance</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <span style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</span>
                      </div>
                    </td>
                    <td><code style={{ fontSize: '0.8125rem', background: 'var(--gray-100)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>{s.studentCode}</code></td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--gray-500)' }}>{s.gender}</td>
                    <td>{s.class?.name || <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>

                    {/* Inline grades column — teacher view only, filtered to teacher's subjects */}
                    {isTeacher && (
                      <td style={{ maxWidth: 260 }}>
                        {(() => {
                          // Only show grades for subjects this teacher teaches in the selected class
                          const mySubjects = new Set(
                            (activeClass?.teachers || [])
                              .filter(t =>
                                t.teacher?.id === currentUser?.id ||
                                String(t.teacher?.id) === String(currentUser?.id)
                              )
                              .map(t => t.subject?.toLowerCase())
                          )
                          const myGrades = (s.grades || []).filter(g =>
                            mySubjects.has(g.subject?.toLowerCase())
                          )
                          return myGrades.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                              {myGrades.map((g, i) => (
                                <span key={i} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: 4,
                                  background: 'var(--gray-50)',
                                  border: '1px solid var(--gray-200)',
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                }}>
                                  <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{g.subject}</span>
                                  <span style={{ color: 'var(--gray-400)' }}>·</span>
                                  <span style={{
                                    fontWeight: 700,
                                    color: g.score >= 70 ? 'var(--success)' : g.score >= 50 ? 'var(--warning)' : 'var(--danger)',
                                  }}>{g.grade}</span>
                                  <span style={{ color: 'var(--gray-400)', fontSize: '0.7rem' }}>{g.score}%</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: 'var(--gray-300)' }}>No grades yet</span>
                          )
                        })()}
                      </td>
                    )}

                    {!isTeacher && (
                      <td>
                        <span style={{ fontWeight: 600, color: (s.feeBalance || 0) <= 0 ? 'var(--danger)' : 'var(--success)' }}>
                          {(s.feeBalance || 0).toLocaleString()} RWF
                        </span>
                        {(s.feeBalance || 0) <= 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: '0.1rem' }}>Unpaid</div>
                        )}
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {/* Grades button — opens modal to add/update a grade */}
                        <button className="btn btn-outline btn-sm" onClick={() => {
                          const termLabel = currentTerm
                            ? `${currentTerm.name} ${currentTerm.academicYear}`
                            : ''
                          setGradeForm({ subject: '', score: '', grade: 'A', term: termLabel })
                          setShowGrades({ ...s, id: String(s.id) })
                        }}>
                          <BookOpen size={13} /> {isTeacher ? 'Add Grade' : 'Grades'}
                        </button>
                        {/* Attendance history — admin only */}
                        {!isTeacher && (
                          <button className="btn btn-outline btn-sm" onClick={() => {
                            setShowAttend({ ...s, id: String(s.id) })
                          }}>
                            <CalendarCheck size={13} /> Attendance
                          </button>
                        )}
                        {/* Admin-only actions */}
                        {!isTeacher && (
                          <>
                            <button className="btn btn-outline btn-sm" onClick={() => { setShowClass(s); setAssignClassId(s.class?._id || s.class || '') }}>
                              <School size={13} /> {s.class ? 'Change Class' : 'Assign Class'}
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: s.userId ? 'var(--success-light)' : 'var(--primary-light)', color: s.userId ? 'var(--success)' : 'var(--primary)', border: 'none' }}
                              onClick={() => { setShowLink(s); setLinkEmail('') }}
                            >
                              <Link2 size={13} /> {s.userId ? 'Linked' : 'Link Account'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={isTeacher ? 6 : 6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>
                      {isTeacher ? 'No students found in this class.' : 'No students found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Bulk Attendance Sheet (teacher) ─────────────────────────────────── */}
      {showBulkAttend && (
        <div className="modal-overlay" onClick={() => setShowBulkAttend(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              <CalendarCheck size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Attendance — {showBulkAttend}
            </h2>

            {/* Date picker */}
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input type="date" className="form-input" value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)} required />
            </div>

            {/* Quick-set all */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', alignSelf: 'center', marginRight: '0.25rem' }}>Mark all:</span>
              {STATUSES.map(st => (
                <button key={st} type="button"
                  className="btn btn-outline btn-sm"
                  style={{ textTransform: 'capitalize', color: STATUS_COLORS[st], borderColor: STATUS_COLORS[st] }}
                  onClick={() => setAllStatus(st)}>
                  {st}
                </button>
              ))}
            </div>

            {/* Student rows */}
            <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)' }}>
              {bulkRows.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>No students in this class.</div>
              ) : (
                <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                      <th style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)' }}>Student</th>
                      <th style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.map((r, i) => (
                      <tr key={r.studentId} style={{ borderBottom: i < bulkRows.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                        <td style={{ padding: '0.625rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}>
                              {r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span style={{ fontWeight: 500 }}>{r.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                            {STATUSES.map(st => (
                              <button key={st} type="button"
                                onClick={() => updateBulkRow(r.studentId, st)}
                                style={{
                                  padding: '0.25rem 0.625rem',
                                  borderRadius: 20,
                                  border: `1.5px solid ${r.status === st ? STATUS_COLORS[st] : 'var(--gray-200)'}`,
                                  background: r.status === st ? STATUS_COLORS[st] : 'transparent',
                                  color: r.status === st ? 'white' : 'var(--gray-500)',
                                  fontSize: '0.75rem',
                                  fontWeight: r.status === st ? 600 : 400,
                                  cursor: 'pointer',
                                  textTransform: 'capitalize',
                                  transition: 'all 0.12s',
                                }}>
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', marginTop: '0.75rem' }}>
              {bulkRows.filter(r => r.status === 'present').length} present ·{' '}
              {bulkRows.filter(r => r.status === 'absent').length} absent ·{' '}
              {bulkRows.filter(r => r.status === 'late').length} late ·{' '}
              {bulkRows.filter(r => r.status === 'excused').length} excused
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowBulkAttend(null)}>Cancel</button>
              <button className="btn btn-primary"
                disabled={bulkAttendMut.isPending || bulkRows.length === 0}
                onClick={() => bulkAttendMut.mutate(bulkRows)}>
                {bulkAttendMut.isPending ? 'Saving…' : `Save Attendance (${bulkRows.length} students)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Grades modal (both roles) ────────────────────────────────────────── */}
      {showGrades && (() => {
        // For teachers: get the subjects they teach in the selected class
        const teacherSubjects = isTeacher && activeClass
          ? (activeClass.teachers || [])
              .filter(t =>
                t.teacher?.id === currentUser?.id ||
                String(t.teacher?.id) === String(currentUser?.id)
              )
              .map(t => t.subject)
          : []

        // Auto-calculate letter grade from score
        const autoGrade = (score) => {
          const n = Number(score)
          if (n >= 90) return 'A+'
          if (n >= 85) return 'A'
          if (n >= 80) return 'A-'
          if (n >= 75) return 'B+'
          if (n >= 70) return 'B'
          if (n >= 65) return 'B-'
          if (n >= 60) return 'C+'
          if (n >= 55) return 'C'
          if (n >= 50) return 'C-'
          if (n >= 40) return 'D'
          return 'F'
        }

        return (
          <div className="modal-overlay" onClick={() => setShowGrades(null)}>
            <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">
                <BookOpen size={17} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Grades — {showGrades.firstName} {showGrades.lastName}
              </h2>

              {/* Existing grades for this student */}
              {studentProfile?.grades?.length > 0 ? (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Recorded Grades
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 160, overflowY: 'auto' }}>
                    {studentProfile.grades.map((g, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem', background: 'var(--gray-50)', borderRadius: 6,
                        borderLeft: `3px solid ${g.score >= 70 ? 'var(--success)' : g.score >= 50 ? 'var(--warning)' : 'var(--danger)'}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontWeight: 700, fontSize: '0.8125rem', color: 'white',
                            background: 'var(--primary)', padding: '0.1rem 0.5rem',
                            borderRadius: 4, whiteSpace: 'nowrap',
                          }}>{g.subject}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{g.term}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: 500 }}>{g.score}%</span>
                          <span style={{
                            fontWeight: 700, fontSize: '1rem', minWidth: 28, textAlign: 'center',
                            color: g.score >= 70 ? 'var(--success)' : g.score >= 50 ? 'var(--warning)' : 'var(--danger)',
                          }}>{g.grade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : studentProfile ? (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 6, fontSize: '0.875rem', color: 'var(--gray-400)' }}>
                  No grades recorded yet for this student.
                </div>
              ) : (
                <div style={{ marginBottom: '1rem', fontSize: '0.8125rem', color: 'var(--gray-400)' }}>Loading grades…</div>
              )}

              {/* Add / update a grade */}
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Add / Update Grade
              </div>
              <form onSubmit={(e) => {
                e.preventDefault()
                gradesMut.mutate({ id: String(showGrades.id), grades: [{ ...gradeForm, score: Number(gradeForm.score) }] })
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    {isTeacher && teacherSubjects.length > 0 ? (
                      <select
                        className="form-input"
                        value={gradeForm.subject}
                        onChange={(e) => setGradeForm(p => ({ ...p, subject: e.target.value }))}
                        required
                      >
                        <option value="">— Select subject —</option>
                        {teacherSubjects.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="form-input"
                        placeholder="e.g. Mathematics"
                        value={gradeForm.subject}
                        onChange={(e) => setGradeForm(p => ({ ...p, subject: e.target.value }))}
                        required
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Term *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Term 1 2026"
                      value={gradeForm.term}
                      onChange={(e) => setGradeForm(p => ({ ...p, term: e.target.value }))}
                      required
                    />
                    {currentTerm && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.2rem' }}>
                        Current term: <strong>{currentTerm.name} {currentTerm.academicYear}</strong>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Score (0–100) *</label>
                    <input
                      type="number" min="0" max="100"
                      className="form-input"
                      value={gradeForm.score}
                      onChange={(e) => setGradeForm(p => ({
                        ...p,
                        score: e.target.value,
                        grade: e.target.value ? autoGrade(e.target.value) : p.grade,
                      }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Letter Grade</label>
                    <select
                      className="form-input"
                      value={gradeForm.grade}
                      onChange={(e) => setGradeForm(p => ({ ...p, grade: e.target.value }))}
                    >
                      {['A+','A','A-','B+','B','B-','C+','C','C-','D','F'].map(g => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.2rem' }}>
                      Auto-calculated from score
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowGrades(null); setMsg({ type: '', text: '' }) }}>Done</button>
                  <button type="submit" className="btn btn-primary" disabled={gradesMut.isPending || !gradeForm.subject || !gradeForm.term || !gradeForm.score}>
                    {gradesMut.isPending ? 'Saving…' : 'Save Grade'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

      {/* ── Create student modal (admin only) ───────────────────────────────── */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              <Plus size={17} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Add Student{activeClass ? ` — ${activeClass.name}` : ''}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              // Always include the selected class when adding from a class view
              createMut.mutate({ ...newStudent, class: selectedClassId || undefined })
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="form-group">
                  <label className="form-label">Student Code *</label>
                  <input className="form-input" placeholder="e.g. STU001"
                    value={newStudent.studentCode}
                    onChange={(e) => setNewStudent(p => ({ ...p, studentCode: e.target.value }))}
                    required />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={newStudent.gender}
                    onChange={(e) => setNewStudent(p => ({ ...p, gender: e.target.value }))}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input className="form-input" value={newStudent.firstName}
                    onChange={(e) => setNewStudent(p => ({ ...p, firstName: e.target.value }))}
                    required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input className="form-input" value={newStudent.lastName}
                    onChange={(e) => setNewStudent(p => ({ ...p, lastName: e.target.value }))}
                    required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input" value={newStudent.dateOfBirth}
                  onChange={(e) => setNewStudent(p => ({ ...p, dateOfBirth: e.target.value }))} />
              </div>
              {/* Show which class the student will be added to */}
              {activeClass && (
                <div className="alert alert-info" style={{ marginBottom: '0.75rem' }}>
                  This student will be added to <strong>{activeClass.name}</strong>.
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMut.isPending}>
                  {createMut.isPending ? 'Creating…' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Attendance History modal (admin only) ────────────────────────────── */}
      {showAttend && (() => {
        // Use the full student profile to get attendance records
        const attendanceRecords = (studentProfile?.attendance || [])
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date))

        const statusColor = { present: 'var(--success)', absent: 'var(--danger)', late: 'var(--warning)', excused: 'var(--gray-500)' }
        const statusBadge = { present: 'badge-success', absent: 'badge-danger', late: 'badge-warning', excused: 'badge-info' }

        const total   = attendanceRecords.length
        const present = attendanceRecords.filter(r => r.status === 'present').length
        const absent  = attendanceRecords.filter(r => r.status === 'absent').length
        const late    = attendanceRecords.filter(r => r.status === 'late').length
        const rate    = total ? Math.round((present / total) * 100) : 0

        return (
          <div className="modal-overlay" onClick={() => setShowAttend(null)}>
            <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">
                <CalendarCheck size={17} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Attendance — {showAttend.firstName} {showAttend.lastName}
              </h2>

              {/* Summary stats */}
              {total > 0 && (
                <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--gray-50)', borderRadius: 8 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{rate}%</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>Rate</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{present}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>Present</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>{absent}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>Absent</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--warning)' }}>{late}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>Late</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-500)' }}>{total}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>Total</div>
                  </div>
                </div>
              )}

              {/* Records list */}
              {attendanceRecords.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                  No attendance records yet for this student.
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: 8 }}>
                  <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                        <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)' }}>Date</th>
                        <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((r, i) => (
                        <tr key={i} style={{ borderBottom: i < attendanceRecords.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                          <td style={{ padding: '0.5rem 1rem', color: 'var(--gray-600)' }}>
                            {new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '0.5rem 1rem' }}>
                            <span className={`badge ${statusBadge[r.status] || 'badge-info'}`} style={{ textTransform: 'capitalize' }}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => setShowAttend(null)}>Close</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Assign to class modal (admin only) ──────────────────────────────── */}
      {showClass && (
        <div className="modal-overlay" onClick={() => setShowClass(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Assign to Class — {showClass.firstName} {showClass.lastName}</h2>
            <div className="form-group">
              <label className="form-label">Select Class</label>
              {classes.length === 0 ? (
                <div className="alert alert-warning">No classes found. Create classes first.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 280, overflowY: 'auto' }}>
                  {classes.map((c) => (
                    <label key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem',
                      border: `2px solid ${assignClassId === c.id ? 'var(--primary)' : 'var(--gray-200)'}`,
                      borderRadius: 'var(--radius)',
                      background: assignClassId === c.id ? 'var(--primary-light)' : 'var(--white)',
                      cursor: 'pointer',
                    }}>
                      <input type="radio" name="class" value={c.id} checked={assignClassId === c.id}
                        onChange={() => setAssignClassId(c.id)} style={{ accentColor: 'var(--primary)' }} />
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--radius)', background: 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <School size={15} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--navy)' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                          {c.teachers?.length
                            ? `Teacher: ${c.teachers.map(a => a.teacher ? `${a.teacher.firstName} ${a.teacher.lastName}` : 'Unassigned').join(', ')}`
                            : 'No teacher assigned'} · {c.academicYear || ''}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowClass(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={classMut.isPending || !assignClassId}
                onClick={() => classMut.mutate({ id: showClass.id, classId: assignClassId })}>
                {classMut.isPending ? 'Saving…' : 'Assign to Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Link Account modal (admin only) ─────────────────────────────────── */}
      {showLink && (
        <div className="modal-overlay" onClick={() => setShowLink(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              <Link2 size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Link Account — {showLink.firstName} {showLink.lastName}
            </h2>
            {showLink.userId ? (
              <div className="alert alert-success">This student is already linked to a user account.</div>
            ) : (
              <>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  Enter the email address of the registered parent or student account to link it to this student record.
                  Once linked, that user will see this student's grades, attendance, fees, and timetable in the portal.
                </p>
                <div className="form-group">
                  <label className="form-label">Registered account email *</label>
                  <input type="email" className="form-input" placeholder="e.g. student@example.com"
                    value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} autoFocus />
                </div>
              </>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowLink(null)}>Cancel</button>
              {!showLink.userId && (
                <button className="btn btn-primary" disabled={linkMut.isPending || !linkEmail}
                  onClick={() => linkMut.mutate({ id: showLink.id, email: linkEmail })}>
                  {linkMut.isPending ? 'Linking…' : 'Link Account'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

