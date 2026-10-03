import { motion } from 'framer-motion';
import { ArrowUpRight, LogOut, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageIntro } from '../components/PageParts.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

function initialsOf(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '1px solid var(--line)',
          flexShrink: 0,
        }}
      >
        <Icon size={15} />
      </span>
      <div>
        <p className="eyebrow" style={{ margin: 0 }}>
          {label}
        </p>
        <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{value || '—'}</p>
      </div>
    </div>
  );
}

// A quick-action card rather than a plain button row, matching the
// weight the rest of the site gives to navigational choices (see the
// show/product cards elsewhere) instead of two flat buttons side by side.
function ActionCard({ to, onClick, icon: Icon, title, description }) {
  const content = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon size={18} />
        <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
      </div>
      <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{description}</p>
      <span className="episode-link" style={{ marginTop: 14 }}>
        Go <ArrowUpRight size={15} />
      </span>
    </>
  );

  const style = {
    display: 'block',
    textAlign: 'left',
    width: '100%',
    border: '1px solid var(--line)',
    padding: 20,
    background: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
  };

  if (to) {
    return (
      <Link to={to} style={style}>
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} style={style}>
      {content}
    </button>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <PageIntro kicker="Account" title="Profile" copy="Your account details and access level." />
      <section className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 34 }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: '#111214',
                color: '#fff',
                fontSize: 22,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initialsOf(user?.full_name)}
            </span>
            <div>
              <h2 style={{ margin: 0 }}>{user?.full_name || 'Your account'}</h2>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 6,
                  fontSize: 13,
                  padding: '3px 10px',
                  borderRadius: 999,
                  border: `1px solid ${isAdmin ? '#2e7d32' : 'var(--line)'}`,
                  color: isAdmin ? '#2e7d32' : 'var(--muted)',
                }}
              >
                <ShieldCheck size={13} />
                {isAdmin ? 'Admin' : 'Customer'}
              </span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
            <InfoRow icon={UserIcon} label="Name" value={user?.full_name} />
            <InfoRow icon={Mail} label="Email" value={user?.email} />
          </motion.div>

          <div className="grid two" style={{ marginTop: 30 }}>
            <ActionCard
              to="/orders"
              icon={ArrowUpRight}
              title="My orders"
              description="Track order status and upload proof of payment."
            />
            {isAdmin && (
              <ActionCard
                to="/admin"
                icon={ShieldCheck}
                title="Admin dashboard"
                description="Review orders and verify payments."
              />
            )}
          </div>

          <button
            onClick={logout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 30,
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      </section>
    </>
  );
}
