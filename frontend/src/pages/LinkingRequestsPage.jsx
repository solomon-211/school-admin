import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import api from '../services/api'
import Layout from '../components/Layout'

const getRequests    = () => api.get('/linking').then(r => r.data.data)
const processRequest = ({ id, action }) => api.patch(`/linking/${id}`, { action }).then(r => r.data)

export default function LinkingRequestsPage() {
  const qc = useQueryClient()
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['linkingRequests'],
    queryFn: getRequests,
    refetchInterval: 15000,
  })

  const [msg, setMsg] = React.useState({ type: '', text: '' })

  const processMut = useMutation({
    mutationFn: processRequest,
    onSuccess: (r) => { qc.invalidateQueries(['linkingRequests']); setMsg({ type: 'success', text: r.message }) },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  return (
    <Layout title="Linking Requests">
      <div className="page-header">
        <div>
          <h1 className="page-title">Parent-Child Linking Requests</h1>
          <p className="page-sub">Parents request to link their account to a student using the student code. Review and approve here.</p>
        </div>
        {requests.length > 0 && (
          <span className="badge badge-warning" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}>
            <Clock size={13} /> {requests.length} pending
          </span>
        )}
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.type === 'success' ? <CheckCircle size={15} className="alert-icon" /> : <AlertCircle size={15} className="alert-icon" />}{msg.text}</div>}

      {isLoading ? <div className="spinner" /> : (
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Link2 size={16} /> Pending Requests ({requests.length})</span>
          </div>
          {!requests.length ? (
            <div className="card-body">
              <div className="alert alert-success" style={{ marginBottom: 0 }}>
                <CheckCircle size={16} className="alert-icon" /> No pending linking requests.
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Submitted</th><th>User</th><th>Role</th><th>Student Code</th><th>Message</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id}>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.user?.firstName} {r.user?.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{r.user?.email}</div>
                      </td>
                      <td><span className={`badge badge-${r.user?.role === 'student' ? 'orange' : 'info'}`}>{r.user?.role}</span></td>
                      <td>
                        <code style={{ background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.875rem' }}>
                          {r.studentCode}
                        </code>
                      </td>
                      <td style={{ color: 'var(--gray-500)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.message || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-success btn-sm" disabled={processMut.isPending}
                            onClick={() => processMut.mutate({ id: r._id, action: 'approve' })}>
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                            disabled={processMut.isPending}
                            onClick={() => processMut.mutate({ id: r._id, action: 'reject' })}>
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
