import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [msg, setMsg]         = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setMsg({ type: 'success', text: 'If that email is registered, a reset link has been sent. Check your inbox.' })
    } catch {
      setMsg({ type: 'success', text: 'If that email is registered, a reset link has been sent.' })
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, background: 'var(--primary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <BookOpen size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--white)', marginBottom: '0.375rem' }}>Forgot Password</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray-400)' }}>Enter your staff email to receive a reset link.</p>
        </div>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
          {msg.text && (
            <div className={`alert alert-${msg.type}`}>
              {msg.type === 'success' ? <CheckCircle size={15} className="alert-icon" /> : <AlertCircle size={15} className="alert-icon" />}
              {msg.text}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                <input type="email" className="form-input" style={{ paddingLeft: '2.25rem' }}
                  value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="teacher@school.rw" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
