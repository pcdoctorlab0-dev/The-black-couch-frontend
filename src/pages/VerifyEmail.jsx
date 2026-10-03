import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { api } from '../lib/api';
import { PageIntro } from '../components/PageParts.jsx';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [email, setEmail] = useState(location.state?.email || '');
  const [passcode, setPasscode] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await verifyEmail(email, passcode);
      navigate(location.state?.redirectTo || '/', { replace: true });
    } catch (verificationError) {
      setError(verificationError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const response = await api.resendVerification(email);
      setNotice(response.message);
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageIntro kicker="Account" title="Verify your email" copy="Enter the six-digit code sent to your email address. It expires in 15 minutes." />
      <section className="section">
        <div className="container" style={{ maxWidth: 420 }}>
          <form className="form" onSubmit={handleVerify}>
            <label>
              Email
              <input className="input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Verification code
              <input
                className="input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={passcode}
                onChange={(event) => setPasscode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </label>
            {error && <p role="alert">{error}</p>}
            {notice && <p role="status">{notice}</p>}
            <button className="button" type="submit" disabled={loading || passcode.length !== 6}>
              {loading ? 'Checking…' : 'Verify email'}
            </button>
            <button className="filter" type="button" onClick={handleResend} disabled={loading || !email}>
              Resend code
            </button>
          </form>
          <p className="prose" style={{ marginTop: 18, fontSize: 14 }}>
            <Link to="/register">Back to registration</Link>
          </p>
        </div>
      </section>
    </>
  );
}