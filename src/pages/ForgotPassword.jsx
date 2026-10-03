import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { PageIntro } from '../components/PageParts.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageIntro kicker="Account" title="Reset your password" copy="Enter your registered email and we'll send you a reset link." />
      <section className="section">
        <div className="container" style={{ maxWidth: 420 }}>
          {sent ? (
            <p>Reset link sent. Check your inbox. The link expires in one hour.</p>
          ) : (
            <form className="form" onSubmit={handleSubmit}>
              <label>
                Email
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              {error && <p role="alert">{error}</p>}
              <button className="button" type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
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
