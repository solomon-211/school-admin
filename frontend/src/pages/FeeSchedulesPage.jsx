import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, CheckCircle, AlertCircle, Trash2, School, Wallet, CreditCard, Pencil } from 'lucide-react'
import api from '../services/api'
import { getClasses, getStudents, chargeStudentFee, updateChargeFee, deleteChargeFee } from '../services/adminService'
import Layout from '../components/Layout'

const getSchedules   = () => api.get('/fee-schedules').then(r => r.data.data)
const createSchedule = (d) => api.post('/fee-schedules', d).then(r => r.data.data)
const deleteSchedule = (id) => api.delete(`/fee-schedules/${id}`).then(r => r.data)
// Fetch pending charge transactions so we can show "amount demanded" per student
const getPendingCharges = () => api.get('/fees', { params: { status: 'pending' } })
  .then(r => (r.data.data || []).filter(tx => tx.type === 'charge'))

export default function FeeSchedulesPage() {
  const qc = useQueryClient()

  // ── Class selector state ───────────────────────────────────────────────────
  const [selectedClassId, setSelectedClassId] = useState('')

  const { data: classes = [] }    = useQuery({ queryKey: ['classes'],   queryFn: getClasses })
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({ queryKey: ['feeSchedules'], queryFn: getSchedules })
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students', selectedClassId],
    queryFn:  () => getStudents({ classId: selectedClassId }),
    enabled:  !!selectedClassId,
  })
  // Pending charges so we can show "amount demanded" per student
  const { data: pendingCharges = [] } = useQuery({
    queryKey: ['pendingCharges'],
    queryFn:  getPendingCharges,
    refetchInterval: 10000,
  })

  const activeClass = classes.find(c => c.id === selectedClassId) || null

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [showCreateSchedule, setShowCreateSchedule] = useState(false)
  const [showChargeStudent,  setShowChargeStudent]  = useState(null)
  const [showChargeAll,      setShowChargeAll]      = useState(false)
  const [showEditCharge,     setShowEditCharge]     = useState(null)  // { txId, amount, description }
  const [editChargeForm,     setEditChargeForm]     = useState({ amount: '', description: '' })
  const [msg, setMsg] = useState({ type: '', text: '' })

  // ── Forms ──────────────────────────────────────────────────────────────────
  const [scheduleForm, setScheduleForm] = useState({
    name: '', amount: '', dueDate: '', academicYear: '', term: '', description: '',
  })
  const [chargeForm, setChargeForm] = useState({ amount: '', description: '' })
  const [selectedScheduleId, setSelectedScheduleId] = useState('') // for apply-schedule-to-all

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      qc.invalidateQueries(['feeSchedules'])
      setShowCreateSchedule(false)
      setMsg({ type: 'success', text: 'Fee schedule created.' })
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => { qc.invalidateQueries(['feeSchedules']); setMsg({ type: 'success', text: 'Schedule removed.' }) },
  })

  // Charge a single student
  const chargeMut = useMutation({
    mutationFn: ({ studentId, amount, description }) => chargeStudentFee(studentId, Number(amount), description),
    onSuccess: () => {
      qc.invalidateQueries(['students', selectedClassId])
      qc.invalidateQueries(['pendingCharges'])
      setShowChargeStudent(null)
      setChargeForm({ amount: '', description: '' })
      setMsg({ type: 'success', text: 'Fee charged. Student will see it as an unpaid fee on their portal.' })
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to charge fee.' }),
  })

  // Charge all students in the selected class
  const chargeAllMut = useMutation({
    mutationFn: async ({ amount, description }) => {
      await Promise.all(
        students.map(s => chargeStudentFee(String(s.id), Number(amount), description))
      )
    },
    onSuccess: () => {
      qc.invalidateQueries(['students', selectedClassId])
      qc.invalidateQueries(['pendingCharges'])
      setShowChargeAll(false)
      setChargeForm({ amount: '', description: '' })
      setSelectedScheduleId('')
      setMsg({ type: 'success', text: `Fee charged to all ${students.length} students in ${activeClass?.name}. They will see it as an unpaid fee.` })
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  const editChargeMut = useMutation({
    mutationFn: ({ txId, amount, description }) => updateChargeFee(txId, Number(amount), description),
    onSuccess: () => {
      qc.invalidateQueries(['pendingCharges'])
      setShowEditCharge(null)
      setEditChargeForm({ amount: '', description: '' })
      setMsg({ type: 'success', text: 'Charge updated successfully.' })
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to update charge.' }),
  })

  const deleteChargeMut = useMutation({
    mutationFn: (txId) => deleteChargeFee(txId),
    onSuccess: () => {
      qc.invalidateQueries(['pendingCharges'])
      setMsg({ type: 'success', text: 'Charge deleted. Student will no longer see this fee.' })
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to delete charge.' }),
  })

  const today = new Date()

  // Pre-fill charge form from a selected schedule
  const applySchedule = (scheduleId) => {
    setSelectedScheduleId(scheduleId)
    const s = schedules.find(s => s._id === scheduleId)
    if (s) setChargeForm({ amount: String(s.amount), description: s.name })
  }

  return (
    <Layout title="Fee Schedules">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Schedules</h1>
          <p className="page-sub">Select a class to charge fees to its students, or manage fee schedule templates.</p>
        </div>
        <button className="btn btn-outline" onClick={() => setShowCreateSchedule(true)}>
          <Plus size={15} /> New Schedule Template
        </button>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1rem' }}>
          {msg.type === 'success' ? <CheckCircle size={15} className="alert-icon" /> : <AlertCircle size={15} className="alert-icon" />}
          {msg.text}
        </div>
      )}

      {/* ── Class selector ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
          Select a class to charge fees
        </div>
        {classes.length === 0 ? (
          <div className="alert alert-info">No classes found.</div>
        ) : (
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            {classes.map(c => (
              <button key={c.id} type="button"
                onClick={() => { setSelectedClassId(c.id); setMsg({ type: '', text: '' }) }}
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

      {/* ── Class fee panel ─────────────────────────────────────────────────── */}
      {selectedClassId && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">
              <Wallet size={15} style={{ marginRight: '0.375rem' }} />
              {activeClass?.name} — Student Fees
            </span>
            {students.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => {
                setChargeForm({ amount: '', description: '' })
                setSelectedScheduleId('')
                setShowChargeAll(true)
              }}>
                <CreditCard size={13} /> Charge All Students
              </button>
            )}
          </div>

          {studentsLoading ? <div className="spinner" /> : students.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>
              No students in this class.
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Code</th>
                    <th>Paid Balance</th>
                    <th>Outstanding Fees</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    // Find all pending charges for this student
                    // The admin DTO populates student as { _id, firstName, ... }
                    const studentCharges = pendingCharges.filter(tx => {
                      const txStudentId = tx.student?._id || tx.student?.id || tx.student
                      return String(txStudentId) === String(s.id)
                    })
                    const totalDemanded = studentCharges.reduce((sum, tx) => sum + tx.amount, 0)
                    return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                            {s.firstName[0]}{s.lastName[0]}
                          </div>
                          <span style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</span>
                        </div>
                      </td>
                      <td><code style={{ fontSize: '0.8125rem', background: 'var(--gray-100)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>{s.studentCode}</code></td>
                      <td>
                        <span style={{ fontWeight: 600, color: (s.feeBalance || 0) <= 0 ? 'var(--danger)' : 'var(--success)' }}>
                          {(s.feeBalance || 0).toLocaleString()} RWF
                        </span>
                        {(s.feeBalance || 0) <= 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: '0.1rem' }}>Unpaid</div>
                        )}
                      </td>
                      <td>
                        {totalDemanded > 0 ? (
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                              {totalDemanded.toLocaleString()} RWF
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.2rem' }}>
                              {studentCharges.map((tx, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', flex: 1 }}>
                                    • {tx.description}
                                    <span className="badge badge-warning" style={{ marginLeft: '0.375rem', fontSize: '0.6rem' }}>unpaid</span>
                                  </span>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    title="Edit this charge"
                                    style={{ padding: '0.1rem 0.3rem', color: 'var(--primary)', flexShrink: 0 }}
                                    onClick={() => {
                                      setEditChargeForm({ amount: String(tx.amount), description: tx.description || '' })
                                      setShowEditCharge({ txId: tx.id || tx._id, studentName: `${s.firstName} ${s.lastName}` })
                                    }}
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    title="Delete this charge"
                                    style={{ padding: '0.1rem 0.3rem', color: 'var(--danger)', flexShrink: 0 }}
                                    disabled={deleteChargeMut.isPending}
                                    onClick={() => {
                                      if (window.confirm(`Delete the charge "${tx.description}" (${tx.amount?.toLocaleString()} RWF) for ${s.firstName} ${s.lastName}? The student will no longer owe this fee.`)) {
                                        deleteChargeMut.mutate(tx.id || tx._id)
                                      }
                                    }}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--gray-300)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => {
                          setChargeForm({ amount: '', description: '' })
                          setSelectedScheduleId('')
                          setShowChargeStudent(s)
                        }}>
                          <CreditCard size={13} /> Charge Fee
                        </button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Fee schedule templates ──────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><FileText size={15} style={{ marginRight: '0.375rem' }} /> Fee Schedule Templates</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>Reusable fee definitions</span>
        </div>
        {schedulesLoading ? <div className="spinner" /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Amount</th><th>Due Date</th><th>Term</th><th>Academic Year</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {schedules.map(s => {
                  const overdue = new Date(s.dueDate) < today
                  return (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{s.amount.toLocaleString()} RWF</td>
                      <td style={{ color: overdue ? 'var(--danger)' : undefined }}>
                        {new Date(s.dueDate).toLocaleDateString()}
                        {overdue && <span className="badge badge-danger" style={{ marginLeft: '0.5rem' }}>Overdue</span>}
                      </td>
                      <td>{s.term || '—'}</td>
                      <td>{s.academicYear}</td>
                      <td><span className={`badge badge-${s.isActive ? 'success' : 'gray'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                          onClick={() => { if (window.confirm('Remove this schedule?')) deleteMut.mutate(s._id) }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {!schedules.length && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No fee schedules yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Charge single student modal ─────────────────────────────────────── */}
      {showChargeStudent && (
        <div className="modal-overlay" onClick={() => setShowChargeStudent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <CreditCard size={17} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Charge Fee — {showChargeStudent.firstName} {showChargeStudent.lastName}
            </h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
              Current balance: <strong style={{ color: 'var(--primary)' }}>{(showChargeStudent.feeBalance || 0).toLocaleString()} RWF</strong>
            </div>

            {/* Quick-apply from schedule */}
            {schedules.length > 0 && (
              <div className="form-group">
                <label className="form-label">Apply from schedule (optional)</label>
                <select className="form-input" value={selectedScheduleId}
                  onChange={e => applySchedule(e.target.value)}>
                  <option value="">— Select a schedule to pre-fill —</option>
                  {schedules.map(s => (
                    <option key={s._id} value={s._id}>{s.name} — {s.amount.toLocaleString()} RWF</option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={e => { e.preventDefault(); chargeMut.mutate({ studentId: String(showChargeStudent.id), ...chargeForm }) }}>
              <div className="form-group">
                <label className="form-label">Amount (RWF) *</label>
                <input type="number" className="form-input" min="1" required
                  value={chargeForm.amount}
                  onChange={e => setChargeForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="e.g. 150000" />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input className="form-input" required
                  value={chargeForm.description}
                  onChange={e => setChargeForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Term 1 Tuition Fee" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowChargeStudent(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={chargeMut.isPending}>
                  {chargeMut.isPending ? 'Charging…' : 'Charge Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Charge all students modal ───────────────────────────────────────── */}
      {showChargeAll && (
        <div className="modal-overlay" onClick={() => setShowChargeAll(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <CreditCard size={17} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Charge All — {activeClass?.name} ({students.length} students)
            </h2>
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              This will charge the same fee to all {students.length} students in {activeClass?.name}.
            </div>

            {schedules.length > 0 && (
              <div className="form-group">
                <label className="form-label">Apply from schedule (optional)</label>
                <select className="form-input" value={selectedScheduleId}
                  onChange={e => applySchedule(e.target.value)}>
                  <option value="">— Select a schedule to pre-fill —</option>
                  {schedules.map(s => (
                    <option key={s._id} value={s._id}>{s.name} — {s.amount.toLocaleString()} RWF</option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={e => { e.preventDefault(); chargeAllMut.mutate(chargeForm) }}>
              <div className="form-group">
                <label className="form-label">Amount per student (RWF) *</label>
                <input type="number" className="form-input" min="1" required
                  value={chargeForm.amount}
                  onChange={e => setChargeForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="e.g. 150000" />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input className="form-input" required
                  value={chargeForm.description}
                  onChange={e => setChargeForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Term 1 Tuition Fee" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowChargeAll(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={chargeAllMut.isPending}>
                  {chargeAllMut.isPending ? 'Charging…' : `Charge ${students.length} Students`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create schedule template modal ─────────────────────────────────── */}
      {showCreateSchedule && (
        <div className="modal-overlay" onClick={() => setShowCreateSchedule(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create Fee Schedule Template</h2>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate({ ...scheduleForm, amount: Number(scheduleForm.amount) }) }}>
              <div className="form-group">
                <label className="form-label">Fee Name *</label>
                <input className="form-input" placeholder="e.g. Term 1 Tuition"
                  value={scheduleForm.name} onChange={e => setScheduleForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="form-group">
                  <label className="form-label">Amount (RWF) *</label>
                  <input type="number" className="form-input" placeholder="e.g. 150000"
                    value={scheduleForm.amount} onChange={e => setScheduleForm(p => ({ ...p, amount: e.target.value }))} required min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input type="date" className="form-input"
                    value={scheduleForm.dueDate} onChange={e => setScheduleForm(p => ({ ...p, dueDate: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year *</label>
                  <input className="form-input" placeholder="e.g. 2024-2025"
                    value={scheduleForm.academicYear} onChange={e => setScheduleForm(p => ({ ...p, academicYear: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Term</label>
                  <input className="form-input" placeholder="e.g. Term 1"
                    value={scheduleForm.term} onChange={e => setScheduleForm(p => ({ ...p, term: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Optional details"
                  value={scheduleForm.description} onChange={e => setScheduleForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateSchedule(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMut.isPending}>
                  {createMut.isPending ? 'Creating…' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit charge modal ───────────────────────────────────────────────── */}
      {showEditCharge && (
        <div className="modal-overlay" onClick={() => setShowEditCharge(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <Pencil size={17} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Edit Charge — {showEditCharge.studentName}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
              Update the amount or description of this unpaid fee. The student will see the updated amount on their portal.
            </p>
            <form onSubmit={e => {
              e.preventDefault()
              editChargeMut.mutate({ txId: showEditCharge.txId, ...editChargeForm })
            }}>
              <div className="form-group">
                <label className="form-label">Amount (RWF) *</label>
                <input type="number" className="form-input" min="1" required
                  value={editChargeForm.amount}
                  onChange={e => setEditChargeForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="e.g. 150000" />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input className="form-input" required
                  value={editChargeForm.description}
                  onChange={e => setEditChargeForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Term 1 Tuition Fee" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditCharge(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editChargeMut.isPending || !editChargeForm.amount || !editChargeForm.description}>
                  {editChargeMut.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
