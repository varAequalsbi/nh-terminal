import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NHLogo } from '../Layout/Header';
import { authService } from '../../services/authService';
import Turnstile, { turnstileSiteKey } from './Turnstile';
import './login.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null);
  const [pending, setPending] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [botReset, setBotReset] = useState(0);

  const requestReset = async (event) => {
    event.preventDefault();
    if (turnstileSiteKey && !botToken) {
      setStatus({ type: 'error', message: 'Complete the bot verification first.' });
      return;
    }
    setPending(true);
    setStatus(null);
    try {
      const result = await authService.forgotPassword(email.trim(), botToken || undefined);
      setToken(result.developmentResetToken || '');
      setStatus({
        type: 'success',
        message: result.developmentResetToken
          ? 'Local reset request created. Choose a new password.'
          : result.message,
      });
    } catch (error) {
      setBotToken('');
      setBotReset((value) => value + 1);
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Unable to request a password reset.',
      });
    } finally {
      setPending(false);
    }
  };

  const reset = async (event) => {
    event.preventDefault();
    if (password.length < 12)
      return setStatus({ type: 'error', message: 'Password must contain at least 12 characters.' });
    if (password !== confirm)
      return setStatus({ type: 'error', message: 'Passwords do not match.' });
    setPending(true);
    try {
      await authService.resetPassword(token, password);
      navigate('/login', {
        replace: true,
        state: { message: 'Password reset. Sign in with your new password.' },
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Unable to reset the password.',
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-heading">
          <NHLogo />
          <h1>Reset Password</h1>
          <p>Local development account recovery</p>
        </div>
        {!token ? (
          <form onSubmit={requestReset}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            {status && (
              <small
                className={status.type === 'error' ? 'form-error' : 'form-success'}
                role="status"
              >
                {status.message}
              </small>
            )}
            <Turnstile action="forgot_password" onToken={setBotToken} resetKey={botReset} />
            <button className="login-submit" disabled={pending}>
              {pending ? 'Requesting...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={reset}>
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
              />
            </label>
            {status && (
              <small
                className={status.type === 'error' ? 'form-error' : 'form-success'}
                role="status"
              >
                {status.message}
              </small>
            )}
            <button className="login-submit" disabled={pending}>
              {pending ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
        <div className="signup-copy">
          <Link to="/login">Back to Log In</Link>
        </div>
      </section>
    </main>
  );
}
