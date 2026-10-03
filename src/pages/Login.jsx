import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { PageIntro } from '../components/PageParts.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If Store sent us here mid-checkout, go back there instead of home.
  const redirectTo = location.state?.redirectTo || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo);
    } catch (err) {
      // Backend always returns the same generic message for bad email or
      // bad password, so the UI can't leak which one was wrong either.
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageIntro kicker="Account" title="Log in" copy="Log in to check out, upload proof of payment, and track your orders." />
      <section className="section">
        <div className="container" style={{ maxWidth: 420 }}>
          <form className="form" onSubmit={handleSubmit}>
            <label>
              Email
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
          <p className="prose" style={{ marginTop: 18, fontSize: 14 }}>
            <Link to="/forgot-password">Forgot your password?</Link>
          </p>
          <p className="prose" style={{ fontSize: 14 }}>
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </>
  );
}
