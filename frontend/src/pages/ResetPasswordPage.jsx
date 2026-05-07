import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { BookOpen, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../services/api'
import PasswordInput from '../components/PasswordInput'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')

  const [form, setForm]     = useState({ password: '', confirm: '' })
  const [msg, setMsg]       = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setMsg({ type: 'danger', text: 'Passwords do not match.' }); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password: form.password })
      setMsg({ type: 'success', text: 'Password reset! Redirecting to login…' })
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.message || 'Reset link is invalid or expired.' })
    } finally { setLoading(false) }
  }

  if (!token) return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: '2rem', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div className="alert alert-danger">Invalid or missing reset token.</div>
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to login</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, background: 'var(--primary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <BookOpen size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--white)' }}>Reset Password</h1>
        </div>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
          {msg.text && <div className={`alert alert-${msg.type}`}>{msg.type === 'success' ? <CheckCircle size={15} className="alert-icon" /> : <AlertCircle size={15} className="alert-icon" />}{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <PasswordInput value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8} placeholder="Min. 8 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <PasswordInput value={form.confirm} onChange={(e) => setForm(p => ({ ...p, confirm: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
