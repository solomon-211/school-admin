import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, CheckCircle, AlertCircle, Info, Mail, User, School } from 'lucide-react'
import { createStaff } from '../services/adminService'
import { getTeachers } from '../services/adminService'
import Layout from '../components/Layout'
import PasswordInput from '../components/PasswordInput'

export default function TeachersPage() {
  const qc = useQueryClient()
  const { data: teachers = [], isLoading } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers })
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'teacher' })
  const [msg, setMsg]   = useState({ type: '', text: '' })

  const createMut = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      setMsg({ type: 'success', text: 'Staff member created successfully.' })
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'teacher' })
      qc.invalidateQueries(['teachers'])
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to create staff member.' }),
  })

  return (
    <Layout title="Teachers & Staff">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teachers &amp; Staff</h1>
          <p className="page-sub">Create staff accounts. Teachers log in at this same portal using the credentials you set here.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Create form */}
        <div>
          {msg.text && (
            <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1.25rem' }}>
              {msg.type === 'success' ? <CheckCircle size={16} className="alert-icon" /> : <AlertCircle size={16} className="alert-icon" />}
              {msg.text}
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <span className="card-title"><Users size={16} /> Create Staff Account</span>
            </div>
            <div className="card-body">
              <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
                <Info size={15} className="alert-icon" />
                <span>After creating an account, share the <strong>email and password</strong> with the staff member. They log in at <strong>this same URL</strong>.</span>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form) }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                      <input className="form-input" style={{ paddingLeft: '2.25rem' }} placeholder="e.g. John"
                        value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                      <input className="form-input" style={{ paddingLeft: '2.25rem' }} placeholder="e.g. Doe"
                        value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} required />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                    <input type="email" className="form-input" style={{ paddingLeft: '2.25rem' }} placeholder="teacher@school.rw"
                      value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <PasswordInput value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                    required minLength={8} placeholder="Min. 8 characters" />
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                    Share this password with the staff member after creation.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {[
                      { value: 'teacher', label: 'Teacher', desc: 'Update grades & attendance' },
                      { value: 'admin',   label: 'Admin',   desc: 'Full system access' },
                    ].map((r) => (
                      <label key={r.value} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                        padding: '0.875rem', border: `2px solid ${form.role === r.value ? 'var(--primary)' : 'var(--gray-200)'}`,
                        borderRadius: 'var(--radius)', background: form.role === r.value ? 'var(--primary-light)' : 'var(--white)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                        <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                          onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                          style={{ marginTop: '2px', accentColor: 'var(--primary)' }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--navy)' }}>{r.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.1rem' }}>{r.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={createMut.isPending}>
                  {createMut.isPending ? 'Creating…' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Staff list */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Users size={16} /> All Staff ({teachers.length})</span>
          </div>
          {isLoading ? <div className="spinner" /> : (
            <div>
              {teachers.length === 0 ? (
                <div className="card-body" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>
                  No staff accounts yet. Create one using the form.
                </div>
              ) : (
                teachers.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0 }}>
                      {t.firstName[0]}{t.lastName[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--navy)' }}>{t.firstName} {t.lastName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email}</div>
                    </div>
                    <span className="badge badge-orange">Teacher</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}
