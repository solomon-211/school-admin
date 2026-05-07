import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Smartphone, Clock, AlertTriangle } from 'lucide-react'
import { getPendingDevices, verifyDevice, revokeDevice } from '../services/adminService'
import Layout from '../components/Layout'

export default function DevicesPage() {
  const qc = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['pendingDevices'],
    queryFn: getPendingDevices,
    refetchInterval: 10000, // check every 10s for new registrations
  })

  const verifyMut = useMutation({
    mutationFn: ({ userId, deviceId }) => verifyDevice(userId, deviceId),
    onSuccess: () => qc.invalidateQueries(['pendingDevices']),
  })

  const revokeMut = useMutation({
    mutationFn: ({ userId, deviceId }) => revokeDevice(userId, deviceId),
    onSuccess: () => qc.invalidateQueries(['pendingDevices']),
  })

  const totalPending = users?.reduce((s, u) => s + u.pendingDevices.length, 0) || 0

  return (
    <Layout title="Device Verification">
      <div className="page-header">
        <div>
          <h1 className="page-title">Device Verification</h1>
          <p className="page-sub">Approve or reject user devices before granting portal access.</p>
        </div>
        {totalPending > 0 && (
          <span className="badge badge-warning" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}>
            <Clock size={13} /> {totalPending} pending
          </span>
        )}
      </div>

      {isLoading ? <div className="spinner" /> : (
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Smartphone size={16} /> Pending Approvals</span>
          </div>

          {!users?.length ? (
            <div className="card-body">
              <div className="alert alert-success" style={{ marginBottom: 0 }}>
                <CheckCircle size={16} className="alert-icon" />
                All devices have been verified. No pending approvals.
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Device ID</th>
                    <th>Device Name</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u) =>
                    u.pendingDevices.map((d) => (
                      <tr key={`${u.userId}-${d.deviceId}`}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'var(--primary-light)', color: 'var(--primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                            }}>
                              {u.firstName[0]}{u.lastName[0]}
                            </div>
                            <span style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--gray-500)' }}>{u.email}</td>
                        <td><span className={`badge badge-${u.role === 'student' ? 'orange' : 'info'}`}>{u.role}</span></td>
                        <td>
                          <code style={{ fontSize: '0.75rem', background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                            {d.deviceId}
                          </code>
                        </td>
                        <td>{d.deviceName}</td>
                        <td style={{ color: 'var(--gray-400)', fontSize: '0.8125rem' }}>
                          {new Date(d.registeredAt).toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => verifyMut.mutate({ userId: u.userId, deviceId: d.deviceId })}
                              disabled={verifyMut.isPending}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                              onClick={() => revokeMut.mutate({ userId: u.userId, deviceId: d.deviceId })}
                              disabled={revokeMut.isPending}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
