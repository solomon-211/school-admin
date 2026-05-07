import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, getStoredUser } from '../services/authService'

/**
 * Protects a route by authentication.
 * Optionally restricts to specific roles via the `roles` prop.
 */
export default function ProtectedRoute({ children, roles }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />

  if (roles) {
    const user = getStoredUser()
    if (!user || !roles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
