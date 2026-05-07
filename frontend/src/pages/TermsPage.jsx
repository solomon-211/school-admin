import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Plus, CheckCircle, AlertCircle, Star, Trash2 } from 'lucide-react'
import api from '../services/api'
import Layout from '../components/Layout'

const getTerms        = () => api.get('/terms').then(r => r.data.data)
const createTerm      = (d) => api.post('/terms', d).then(r => r.data.data)
const setCurrentTerm  = (id) => api.patch(`/terms/${id}/set-current`).then(r => r.data)
const deleteTerm      = (id) => api.delete(`/terms/${id}`).then(r => r.data)

export default function TermsPage() {
  const qc = useQueryClient()
  const { data: terms = [], isLoading } = useQuery({ queryKey: ['terms'], queryFn: getTerms })
  const [showCreate, setShowCreate] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [form, setForm] = useState({ name: '', academicYear: '', startDate: '', endDate: '' })

  const createMut = useMutation({
    mutationFn: createTerm,
    onSuccess: () => { qc.invalidateQueries(['terms']); setShowCreate(false); setMsg({ type: 'success', text: 'Term created.' }) },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  const currentMut = useMutation({
    mutationFn: setCurrentTerm,
    onSuccess: (r) => { qc.invalidateQueries(['terms']); setMsg({ type: 'success', text: r.message }) },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteTerm,
    onSuccess: () => { qc.invalidateQueries(['terms']); setMsg({ type: 'success', text: 'Term deleted.' }) },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  return (
    <Layout title="Academic Terms">
      <div className="page-header">
        <div>
          <h1 className="page-title">Academic Terms</h1>
          <p className="page-sub">Define term dates. The current term is used as the default for grades and attendance.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> New Term</button>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.type === 'success' ? <CheckCircle size={15} className="alert-icon" /> : <AlertCircle size={15} className="alert-icon" />}{msg.text}</div>}

      {isLoading ? <div className="spinner" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {terms.map((t) => (
            <div key={t._id} className="card" style={{ border: t.isCurrent ? '2px solid var(--primary)' : undefined }}>
              <div className="card-header">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {t.name}
                    {t.isCurrent && <span className="badge badge-orange">Current</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.2rem' }}>{t.academicYear}</div>
                </div>
              </div>
              <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <div style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}>Start</div>
                    <div style={{ fontWeight: 500 }}>{new Date(t.startDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}>End</div>
                    <div style={{ fontWeight: 500 }}>{new Date(t.endDate).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!t.isCurrent && (
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
                      onClick={() => currentMut.mutate(t._id)} disabled={currentMut.isPending}>
                      <Star size={13} /> Set as Current
                    </button>
                  )}
                  <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                    onClick={() => { if (window.confirm('Delete this term?')) deleteMut.mutate(t._id) }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!terms.length && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
              <Calendar size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No terms yet. Create your first academic term.</p>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create Academic Term</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form) }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="form-group">
                  <label className="form-label">Term Name *</label>
                  <input className="form-input" placeholder="e.g. Term 1" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year *</label>
                  <input className="form-input" placeholder="e.g. 2024-2025" value={form.academicYear} onChange={(e) => setForm(p => ({ ...p, academicYear: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="form-input" value={form.startDate} onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input type="date" className="form-input" value={form.endDate} onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMut.isPending}>{createMut.isPending ? 'Creating…' : 'Create Term'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
