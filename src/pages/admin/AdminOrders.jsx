import { useEffect, useState } from 'react';
import { api, centsToRands } from '../../lib/api';
import AdminLayout from './AdminLayout.jsx';

const TABS = [
  ['pending_payment', 'Pending payment'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
  ['', 'All'],
];

// Proof files are never linked directly (no public URL to leak). We fetch
// them through the authenticated admin endpoint and render as a blob, so an
// admin session cookie is required for every byte that leaves the server.
// Image proofs render as a small thumbnail so Kingsley can sanity-check a
// proof at a glance, without opening every single one full-size.
function ProofViewer({ proofId }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [isImage, setIsImage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let revoke;
    fetch(api.adminProofImageUrl(proofId), { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Could not load proof.');
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        revoke = url;
        setIsImage(blob.type.startsWith('image/'));
        setBlobUrl(url);
      })
      .catch((err) => setError(err.message));

    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [proofId]);

  if (error)
    return (
      <p role="alert" style={{ fontSize: 13 }}>
        {error}
      </p>
    );
  if (!blobUrl) return <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading proof…</p>;

  return (
    <a href={blobUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {isImage ? (
        <img
          src={blobUrl}
          alt="Uploaded proof of payment"
          style={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid var(--line)' }}
        />
      ) : (
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>PDF</span>
      )}
      <span className="episode-link">View full size</span>
    </a>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending_payment');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', text }

  function refresh() {
    setLoading(true);
    api
      .adminOrders(statusFilter)
      .then((d) => setOrders(d.orders))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [statusFilter]);

  async function decide(orderId, decision) {
    if (decision === 'reject') {
      const confirmed = window.confirm(
        'Reject this order? Its reserved stock is released back to inventory automatically, and this cannot be undone.'
      );
      if (!confirmed) return;
    }

    setActioning(orderId);
    setNotice(null);
    try {
      await api.adminVerifyOrder(orderId, decision);
      setNotice({
        type: 'success',
        text: decision === 'reject' ? 'Order rejected — stock released back to inventory.' : 'Order approved.',
      });
      refresh();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setActioning(null);
    }
  }

  const visibleOrders = orders.filter((order) =>
    `${order.order_ref} ${order.customer_name} ${order.customer_email}`.toLowerCase().includes(query.toLowerCase())
  );
  const totalCents = visibleOrders.reduce((sum, o) => sum + o.total_cents, 0);

  return (
    <AdminLayout>
      <div className="container" style={{ padding: '40px 0 60px' }}>
        <h1 style={{ margin: '0 0 6px' }}>Order Verification</h1>
        <p style={{ color: 'var(--muted)', margin: '0 0 26px' }}>
          Approve or reject against proof of payment. Rejecting an order returns its stock automatically.
        </p>

        <div className="toolbar">
          {TABS.map(([value, label]) => (
            <button
              key={value || 'all'}
              className={`filter ${statusFilter === value ? 'active' : ''}`}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="toolbar" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Search order ref, name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            {visibleOrders.length} order{visibleOrders.length === 1 ? '' : 's'} · {centsToRands(totalCents)} total
          </p>
        </div>

        {notice && (
          <p
            style={{
              marginTop: 16,
              padding: '10px 14px',
              border: `1px solid ${notice.type === 'error' ? '#b3261e' : '#2e7d32'}`,
              color: notice.type === 'error' ? '#b3261e' : '#2e7d32',
            }}
          >
            {notice.text}
          </p>
        )}
        {loading && <p style={{ marginTop: 16 }}>Loading…</p>}
        {!loading && visibleOrders.length === 0 && (
          <p style={{ marginTop: 16, color: 'var(--muted)' }}>No orders match.</p>
        )}

        {visibleOrders.map((order) => (
          <article key={order.id} style={{ borderBottom: '1px solid var(--line)', padding: '22px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ margin: 0 }}>{order.order_ref}</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
                  {order.customer_name} · {order.customer_email}
                </p>
                {order.created_at && (
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                )}
              </div>
              <p style={{ fontWeight: 600 }}>{centsToRands(order.total_cents)}</p>
            </div>

            {/* Defensive: only renders if the API actually includes line items */}
            {Array.isArray(order.items) && order.items.length > 0 && (
              <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 14, color: 'var(--muted)' }}>
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.product_name} ({item.size}) × {item.quantity}
                  </li>
                ))}
              </ul>
            )}

            <div style={{ marginTop: 12 }}>
              {order.proof_id ? <ProofViewer proofId={order.proof_id} /> : <em>No proof uploaded yet</em>}
            </div>

            {order.status === 'pending_payment' && (
              <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                <button
                  className="button"
                  style={{ padding: '6px 18px' }}
                  disabled={actioning === order.id}
                  onClick={() => decide(order.id, 'approve')}
                >
                  Approve
                </button>
                <button
                  style={{
                    padding: '6px 18px',
                    background: 'transparent',
                    border: '1px solid #b3261e',
                    color: '#b3261e',
                    cursor: 'pointer',
                    borderRadius: 3,
                  }}
                  disabled={actioning === order.id}
                  onClick={() => decide(order.id, 'reject')}
                >
                  Reject
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </AdminLayout>
  );
}
