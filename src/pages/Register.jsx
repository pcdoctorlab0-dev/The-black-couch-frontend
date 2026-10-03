import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { PageIntro } from '../components/PageParts.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordTooShort = form.password.length > 0 && form.password.length < 10;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await register(form);
      navigate('/verify-email', {
        state: { email: response.email, redirectTo: location.state?.redirectTo },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageIntro kicker="Account" title="Create an account" copy="You'll need an account to check out and track your orders." />
      <section className="section">
        <div className="container" style={{ maxWidth: 420 }}>
          <form className="form" onSubmit={handleSubmit}>
            <label>
              Full name
              <input
                className="input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label>
              Password (min 10 characters)
              <input
                className="input"
                type="password"
                minLength={10}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>
            {passwordTooShort && (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                {10 - form.password.length} more character{10 - form.password.length === 1 ? '' : 's'} needed.
              </p>
            )}
            {error && <p role="alert">{error}</p>}
            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Register'}
            </button>
          </form>
          <p className="prose" style={{ marginTop: 18, fontSize: 14 }}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </>
  );
}
