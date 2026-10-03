import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageIntro } from '../components/PageParts.jsx';
import { useAuth } from '../lib/AuthContext.jsx';
import { api } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const { refreshSession } = useAuth();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('This reset link is invalid or has expired.');
      return;
    }
    if (password.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      await refreshSession();
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageIntro kicker="Account" title="Choose a new password" copy="Use at least 10 characters for your new password." />
      <section className="section">
        <div className="container" style={{ maxWidth: 440 }}>
          {done ? (
            <p role="status">Your password has been updated. <Link to="/login">Log in</Link> with your new password.</p>
          ) : (
            <form className="form" onSubmit={handleSubmit}>
              <label>
                New password
                <input className="input" type="password" minLength={10} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>
              <label>
                Confirm new password
                <input className="input" type="password" minLength={10} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              </label>
              {error && <p role="alert">{error}</p>}
              <button className="button" type="submit" disabled={loading || !token}>
                {loading ? 'Updating…' : 'Update password'}
              </button>
              {!token && <p role="alert">This reset link is invalid or has expired.</p>}
            </form>
          )}
          <p className="prose" style={{ marginTop: 18, fontSize: 14 }}>
            <Link to="/login">Back to log in</Link>
          </p>
        </div>
      </section>
    </>
  );
}
