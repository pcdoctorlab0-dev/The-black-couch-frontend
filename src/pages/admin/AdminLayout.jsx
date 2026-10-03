import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';

// A deliberately separate shell from the public site's <Header>/<Footer>.
// Kingsley is the only person who ever sees this — the store nav, cart
// icon and footer links were pure noise here, and a distinct dark bar
// also makes it visually unmistakable that you're in the admin area,
// not on a page a customer could stumble onto.
const NAV = [
  ['Dashboard', '/admin'],
  ['Orders', '/admin/orders'],
  ['Episodes', '/admin/episodes'],
  ['Products', '/admin/products'],
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ background: '#111214', color: '#fff' }}>
        <div
          className="container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', flexWrap: 'wrap', gap: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
            <span style={{ fontWeight: 700, letterSpacing: '.01em' }}>
              The Black Couch <span style={{ opacity: 0.55, fontWeight: 400 }}>· Admin</span>
            </span>
            <nav style={{ display: 'flex', gap: 20 }}>
              {NAV.map(([label, path]) => {
                const active = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    style={{
                      color: active ? '#fff' : 'rgba(255,255,255,.6)',
                      borderBottom: active ? '2px solid #fff' : '2px solid transparent',
                      paddingBottom: 4,
                      fontSize: 14,
                    }}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 14 }}>
            {user?.full_name && <span style={{ opacity: 0.7 }}>{user.full_name}</span>}
            <Link to="/" style={{ color: 'rgba(255,255,255,.7)' }}>
              View site
            </Link>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,.35)',
                color: '#fff',
                padding: '5px 14px',
                borderRadius: 3,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
