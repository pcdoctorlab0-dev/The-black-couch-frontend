import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, centsToRands } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext.jsx';
import AdminLayout from './AdminLayout.jsx';

// Reuses the existing adminOrders('') endpoint rather than adding a new
// stats API — computes the summary client-side from the full order list.
// If order volume grows large enough that this gets slow, that's the
// point to add a dedicated /admin/stats endpoint instead.
export default function AdminDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .adminOrders('')
      .then((d) => setOrders(d.orders))
      .catch(() => setError('Could not load dashboard stats.'));
  }, []);

  const pending = orders?.filter((o) => o.status === 'pending_payment') ?? [];
  const approved = orders?.filter((o) => o.status === 'approved') ?? [];
  const rejected = orders?.filter((o) => o.status === 'rejected') ?? [];
  const approvedRevenue = approved.reduce((sum, o) => sum + o.total_cents, 0);
  const firstName = user?.full_name?.split(' ')[0];

  const stats = [
    { label: 'Awaiting review', value: orders ? pending.length : '—' },
    { label: 'Approved orders', value: orders ? approved.length : '—' },
    { label: 'Rejected orders', value: orders ? rejected.length : '—' },
    { label: 'Approved revenue', value: orders ? centsToRands(approvedRevenue) : '—' },
  ];

  return (
    <AdminLayout>
      <div className="container" style={{ padding: '40px 0 60px' }}>
        <p style={{ color: 'var(--muted)', margin: '0 0 4px' }}>Welcome back{firstName ? `, ${firstName}` : ''}</p>
        <h1 style={{ margin: '0 0 30px' }}>Dashboard</h1>

        {error && <p role="alert">{error}</p>}

        <div className="grid three">
          {stats.map((stat) => (
            <div key={stat.label} style={{ border: '1px solid var(--line)', padding: 20 }}>
              <p className="eyebrow">{stat.label}</p>
              <p style={{ fontSize: 36, margin: '6px 0 0' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid three" style={{ marginTop: 44 }}>
          {[
            ['Add an episode', 'Link a new YouTube episode to the site.', '/admin/episodes'],
            ['Clothing & merch', 'Add items and update stock levels.', '/admin/products'],
          ].map(([title, copy, to]) => (
            <Link key={to} to={to} style={{ border: '1px solid var(--line)', padding: 20, display: 'block' }}>
              <h3 style={{ margin: 0 }}>{title}</h3>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>{copy}</p>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 44 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ margin: 0 }}>Needs attention</h2>
            <Link className="episode-link" to="/admin/orders">
              View all orders
            </Link>
          </div>

          {orders === null && !error && <p style={{ marginTop: 16, color: 'var(--muted)' }}>Loading…</p>}
          {orders !== null && pending.length === 0 && (
            <p style={{ marginTop: 16, color: 'var(--muted)' }}>Nothing waiting on you right now.</p>
          )}

          {pending.slice(0, 5).map((order) => (
            <div
              key={order.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                borderBottom: '1px solid var(--line)',
                padding: '14px 0',
              }}
            >
              <div>
                <strong>{order.order_ref}</strong>
                <span style={{ color: 'var(--muted)', marginLeft: 10 }}>{order.customer_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span>{centsToRands(order.total_cents)}</span>
                <Link className="filter" to="/admin/orders">
                  Review
                </Link>
              </div>
            </div>
          ))}
          {pending.length > 5 && (
            <p style={{ marginTop: 10, color: 'var(--muted)' }}>+{pending.length - 5} more waiting.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
