import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CreditCard, CheckCircle, XCircle, Clock, Link2,
  FileText, Eye, ArrowDownCircle, ArrowUpCircle, AlertTriangle,
} from 'lucide-react'
import { getTransactions, getFeeStats, processWithdrawal } from '../services/adminService'
import Layout from '../components/Layout'

const statusConfig = {
  approved: { badge: 'badge-success', icon: CheckCircle, label: 'Approved' },
  pending:  { badge: 'badge-warning', icon: Clock,        label: 'Pending'  },
  rejected: { badge: 'badge-danger',  icon: XCircle,      label: 'Rejected' },
}

// Charge rows have their own status display — separate from payment transactions
const chargeStatusConfig = {
  pending:  { badge: 'badge-danger',  icon: AlertTriangle, label: 'Awaiting Payment' },
  approved: { badge: 'badge-success', icon: CheckCircle,   label: 'Paid'             },
  rejected: { badge: 'badge-danger',  icon: XCircle,       label: 'Cancelled'        },
}

export default function FeesPage() {
  const qc = useQueryClient()
  const [filter, setFilter]       = useState('')
  const [msg, setMsg]             = useState({ type: '', text: '' })
  const [viewProof, setViewProof] = useState(null)

  const { data: stats } = useQuery({
    queryKey: ['feeStats'], queryFn: getFeeStats, refetchInterval: 15000,
  })
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filter],
    queryFn:  () => getTransactions(filter ? { status: filter } : {}),
    refetchInterval: 15000,
  })

  const processMut = useMutation({
    mutationFn: ({ txId, action }) => processWithdrawal(txId, action),
    onSuccess: (res) => {
      setMsg({ type: 'success', text: res.message })
      qc.invalidateQueries(['transactions'])
      qc.invalidateQueries(['feeStats'])
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed' }),
  })

  return (
    <Layout title="Fee Management">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-sub">Review payment proofs, approve deposits, and process refund requests.</p>
        </div>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1rem' }}>
          {msg.type === 'success' ? <CheckCircle size={16} className="alert-icon" /> : <AlertTriangle size={16} className="alert-icon" />}
          {msg.text}
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success"><ArrowDownCircle size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Collected</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {stats?.totalDeposited?.toLocaleString() || 0}
            </div>
            <div className="stat-sub">RWF approved</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-danger"><ArrowUpCircle size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Refunded</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>
              {stats?.totalWithdrawn?.toLocaleString() || 0}
            </div>
            <div className="stat-sub">RWF refunded</div>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${stats?.pendingWithdrawals > 0 ? 'stat-icon-warning' : 'stat-icon-navy'}`}>
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value" style={{ color: stats?.pendingWithdrawals > 0 ? 'var(--warning)' : undefined }}>
              {stats?.pendingWithdrawals || 0}
            </div>
            <div className="stat-sub">need action</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([val, label]) => (
          <button key={val} className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(val)}>
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><CreditCard size={16} /> Transactions</span>
        </div>
        {isLoading ? <div className="spinner" /> : (
          (() => {
            // Group transactions by student ID so each student appears once
            const grouped = (transactions || []).reduce((acc, tx) => {
              const key = tx.student?._id || tx.student?.studentCode || 'unknown'
              if (!acc[key]) acc[key] = { student: tx.student, txs: [] }
              acc[key].txs.push(tx)
              return acc
            }, {})

            const groups = Object.values(grouped)

            if (!groups.length) {
              return (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>
                  No transactions found.
                </div>
              )
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {groups.map((group, gi) => (
                  <div key={gi} style={{ borderBottom: gi < groups.length - 1 ? '2px solid var(--gray-100)' : 'none' }}>
                    {/* Student header row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1.5rem',
                      background: 'var(--gray-50)',
                      borderBottom: '1px solid var(--gray-200)',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        {group.student?.firstName?.[0]}{group.student?.lastName?.[0]}
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--navy)' }}>
                          {group.student?.firstName} {group.student?.lastName}
                        </span>
                        {group.student?.studentCode && (
                          <code style={{ fontSize: '0.75rem', background: 'var(--gray-200)', padding: '0.1rem 0.4rem', borderRadius: 4, marginLeft: '0.5rem' }}>
                            {group.student.studentCode}
                          </code>
                        )}
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
                        {group.txs.length} transaction{group.txs.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Transactions for this student */}
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--white)' }}>
                          <th style={{ padding: '0.5rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600, borderBottom: '1px solid var(--gray-100)' }}>Date</th>
                          <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600, borderBottom: '1px solid var(--gray-100)' }}>Type</th>
                          <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600, borderBottom: '1px solid var(--gray-100)' }}>Amount</th>
                          <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600, borderBottom: '1px solid var(--gray-100)' }}>Description</th>
                          <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600, borderBottom: '1px solid var(--gray-100)' }}>Proof</th>
                          <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600, borderBottom: '1px solid var(--gray-100)' }}>Status</th>
                          <th style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--gray-100)' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.txs.map((tx, ti) => {
                          const isCharge = tx.type === 'charge'
                          const cfg = isCharge
                            ? (chargeStatusConfig[tx.status] || chargeStatusConfig.pending)
                            : (statusConfig[tx.status] || statusConfig.pending)
                          const StatusIcon = cfg.icon
                          return (
                            <tr key={tx.id} style={{
                              borderBottom: ti < group.txs.length - 1 ? '1px solid var(--gray-100)' : 'none',
                              background: isCharge ? 'rgba(239,68,68,0.03)' : undefined,
                            }}>
                              <td style={{ padding: '0.625rem 1.5rem', fontSize: '0.8125rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '0.625rem 1rem' }}>
                                <span className={`badge ${isCharge ? 'badge-danger' : tx.type === 'deposit' ? 'badge-success' : 'badge-info'}`}>
                                  {isCharge
                                    ? <><CreditCard size={11} /> fee charged</>
                                    : tx.type === 'deposit'
                                      ? <><ArrowDownCircle size={11} /> payment</>
                                      : <><ArrowUpCircle size={11} /> refund</>}
                                </span>
                              </td>
                              <td style={{ padding: '0.625rem 1rem', fontWeight: 700, color: isCharge ? 'var(--danger)' : tx.type === 'deposit' ? 'var(--success)' : 'var(--gray-600)', whiteSpace: 'nowrap' }}>
                                {tx.type === 'deposit' ? '+' : ''}{tx.amount?.toLocaleString()} RWF
                              </td>
                              <td style={{ padding: '0.625rem 1rem', color: 'var(--gray-600)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {tx.description || '—'}
                              </td>
                              <td style={{ padding: '0.625rem 1rem' }}>
                                {isCharge ? (
                                  <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', fontStyle: 'italic' }}>Admin charged</span>
                                ) : tx.proof?.value ? (
                                  <button className="btn btn-outline btn-sm" onClick={() => setViewProof(tx)}>
                                    <Eye size={13} /> View Proof
                                  </button>
                                ) : (
                                  <span style={{ color: 'var(--gray-300)', fontSize: '0.8125rem' }}>No proof</span>
                                )}
                              </td>
                              <td style={{ padding: '0.625rem 1rem' }}>
                                <span className={`badge ${cfg.badge}`}>
                                  <StatusIcon size={11} /> {cfg.label}
                                </span>
                              </td>
                              <td style={{ padding: '0.625rem 1rem' }}>
                                {!isCharge && tx.status === 'pending' && (
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-success btn-sm"
                                      disabled={processMut.isPending}
                                      onClick={() => processMut.mutate({ txId: tx.id, action: 'approve' })}>
                                      <CheckCircle size={13} /> Approve
                                    </button>
                                    <button className="btn btn-outline btn-sm"
                                      style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                                      disabled={processMut.isPending}
                                      onClick={() => processMut.mutate({ txId: tx.id, action: 'reject' })}>
                                      <XCircle size={13} /> Reject
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )
          })()
        )}
      </div>

      {viewProof && (
        <div className="modal-overlay" onClick={() => setViewProof(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Payment Proof</h2>

            <div style={{ marginBottom: '1rem', padding: '0.875rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>Student</span>
                <span style={{ fontWeight: 600 }}>{viewProof.student?.firstName} {viewProof.student?.lastName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>Amount</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>{viewProof.amount?.toLocaleString()} RWF</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-500)' }}>Description</span>
                <span>{viewProof.description || '—'}</span>
              </div>
            </div>

            {viewProof.proof?.type === 'link' ? (
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Payment link provided:</div>
                <a
                  href={viewProof.proof.value}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.875rem', background: 'var(--primary-light)',
                    borderRadius: 'var(--radius)', color: 'var(--primary)',
                    fontWeight: 500, wordBreak: 'break-all',
                  }}
                >
                  <Link2 size={16} style={{ flexShrink: 0 }} />
                  {viewProof.proof.value}
                </a>
              </div>
            ) : viewProof.proof?.mimeType?.startsWith('image/') ? (
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Uploaded image:</div>
                <img
                  src={viewProof.proof.value}
                  alt="Payment proof"
                  style={{ width: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}
                />
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Uploaded PDF:</div>
                <a
                  href={viewProof.proof.value}
                  download="payment-proof.pdf"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.875rem', background: 'var(--gray-50)',
                    borderRadius: 'var(--radius)', color: 'var(--navy)',
                    fontWeight: 500,
                  }}
                >
                  <FileText size={20} style={{ color: 'var(--danger)' }} />
                  Download PDF receipt
                </a>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setViewProof(null)}>Close</button>
              {viewProof.status === 'pending' && (
                <>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => { processMut.mutate({ txId: viewProof.id, action: 'reject' }); setViewProof(null) }}>
                    <XCircle size={14} /> Reject
                  </button>
                  <button className="btn btn-success"
                    onClick={() => { processMut.mutate({ txId: viewProof.id, action: 'approve' }); setViewProof(null) }}>
                    <CheckCircle size={14} /> Approve Payment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
