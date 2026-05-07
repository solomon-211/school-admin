import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowRight, GraduationCap, CheckCircle, AlertCircle, AlertTriangle, Users, School } from 'lucide-react'
import api from '../services/api'
import { getClasses, getStudents } from '../services/adminService'
import Layout from '../components/Layout'

const promoteStudents = (data) => api.post('/students/promote', data).then(r => r.data)

export default function PromotePage() {
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses })
  const [fromClass, setFromClass] = useState('')
  const [toClass,   setToClass]   = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  // Load students from the selected source class so admin can preview who will be moved
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students', fromClass],
    queryFn:  () => getStudents({ classId: fromClass }),
    enabled:  !!fromClass,
  })

  const promoteMut = useMutation({
    mutationFn: promoteStudents,
    onSuccess: (r) => {
      setMsg({ type: 'success', text: r.message })
      setFromClass(''); setToClass(''); setConfirmed(false)
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Promotion failed.' }),
  })

  const fromName = classes.find(c => c.id === fromClass)?.name || ''
  const toName   = classes.find(c => c.id === toClass)?.name   || ''

  const handleFromChange = (val) => { setFromClass(val); setToClass(''); setConfirmed(false); setMsg({ type: '', text: '' }) }
  const handleToChange   = (val) => { setToClass(val);   setConfirmed(false) }

  return (
    <Layout title="Promote Students">
      <div className="page-header">
        <div>
          <h1 className="page-title">Promote Students</h1>
          <p className="page-sub">Move all students from one class to another at the end of the academic year.</p>
        </div>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1rem' }}>
          {msg.type === 'success' ? <CheckCircle size={15} className="alert-icon" /> : <AlertCircle size={15} className="alert-icon" />}
          {msg.text}
        </div>
      )}

      {/* ── Step 1: Select source class ──────────────────────────────────────── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
          Step 1 — Select the class to promote FROM
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          {classes.map(c => (
            <button key={c.id} type="button"
              onClick={() => handleFromChange(c.id)}
              style={{
                padding: '0.5rem 1.125rem', borderRadius: 'var(--radius)',
                border: `2px solid ${fromClass === c.id ? 'var(--primary)' : 'var(--gray-200)'}`,
                background: fromClass === c.id ? 'var(--primary)' : 'var(--white)',
                color: fromClass === c.id ? 'white' : 'var(--navy)',
                fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
              <School size={14} />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Students in selected source class ────────────────────────────────── */}
      {fromClass && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header">
            <span className="card-title">
              <Users size={15} style={{ marginRight: '0.375rem' }} />
              Students in {fromName}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
              {studentsLoading ? 'Loading…' : `${students.length} student${students.length !== 1 ? 's' : ''} will be moved`}
            </span>
          </div>
          {studentsLoading ? (
            <div className="spinner" />
          ) : students.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
              No students in this class.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem 1.5rem' }}>
              {students.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  background: 'var(--gray-50)', borderRadius: 20,
                  border: '1px solid var(--gray-200)',
                  fontSize: '0.8125rem',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {s.firstName[0]}{s.lastName[0]}
                  </div>
                  <span style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</span>
                  <code style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{s.studentCode}</code>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Select destination class ─────────────────────────────────── */}
      {fromClass && students.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
            Step 2 — Select the class to promote TO
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            {classes.filter(c => c.id !== fromClass).map(c => (
              <button key={c.id} type="button"
                onClick={() => handleToChange(c.id)}
                style={{
                  padding: '0.5rem 1.125rem', borderRadius: 'var(--radius)',
                  border: `2px solid ${toClass === c.id ? 'var(--success)' : 'var(--gray-200)'}`,
                  background: toClass === c.id ? 'var(--success)' : 'var(--white)',
                  color: toClass === c.id ? 'white' : 'var(--navy)',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                <School size={14} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm and promote ──────────────────────────────────────── */}
      {fromClass && toClass && students.length > 0 && (
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="card-header">
            <span className="card-title"><ArrowRight size={15} /> Confirm Promotion</span>
          </div>
          <div className="card-body">
            {/* Visual summary */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)',
              marginBottom: '1.25rem',
            }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>FROM</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)' }}>{fromName}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', marginTop: '0.2rem' }}>
                  {students.length} student{students.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
                <ArrowRight size={28} />
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>TO</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--success)' }}>{toName}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', marginTop: '0.2rem' }}>
                  destination class
                </div>
              </div>
            </div>

            <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
              <AlertTriangle size={15} className="alert-icon" />
              This will move <strong>all {students.length} student{students.length !== 1 ? 's' : ''}</strong> from <strong>{fromName}</strong> to <strong>{toName}</strong>. This cannot be undone automatically.
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '1.25rem', cursor: 'pointer', fontSize: '0.875rem', lineHeight: 1.5 }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: 16, height: 16, marginTop: '0.15rem', flexShrink: 0 }} />
              I confirm I want to promote all <strong style={{ margin: '0 0.2rem' }}>{students.length}</strong> students from <strong style={{ margin: '0 0.2rem' }}>{fromName}</strong> to <strong style={{ margin: '0 0.2rem' }}>{toName}</strong>.
            </label>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              disabled={!confirmed || promoteMut.isPending}
              onClick={() => promoteMut.mutate({ fromClassId: fromClass, toClassId: toClass })}>
              <GraduationCap size={16} />
              {promoteMut.isPending ? 'Promoting…' : `Promote ${students.length} Student${students.length !== 1 ? 's' : ''} to ${toName}`}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!fromClass && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
          <GraduationCap size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '0.9375rem' }}>Select a class above to see its students and begin promotion.</p>
        </div>
      )}
    </Layout>
  )
}
