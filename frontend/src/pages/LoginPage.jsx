import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BookOpen, Mail, AlertCircle } from 'lucide-react'
import { login } from '../services/authService'
import PasswordInput from '../components/PasswordInput'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Brand info above the card */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--primary)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <BookOpen size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--white)', marginBottom: '0.375rem' }}>
            School Management System
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray-400)', lineHeight: 1.6 }}>
            Manage students, teachers, classes, fees<br />and device access from one portal.
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.25rem' }}>
            Staff Login
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
            Sign in as an administrator or teacher
          </p>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={16} className="alert-icon" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: '0.75rem',
                  top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--gray-400)', pointerEvents: 'none',
                }} />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                  autoComplete="email"
                  placeholder="admin@school.rw"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <PasswordInput
                id="password"
                value={form.password}
                onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
              <div style={{ textAlign: 'right', marginTop: '0.375rem' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--primary)' }}>Forgot password?</Link>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
