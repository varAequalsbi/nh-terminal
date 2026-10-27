import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NHLogo } from '../Layout/Header';
import { authService } from '../../services/authService';
import Turnstile, { turnstileSiteKey } from './Turnstile';
import './login.css';

export default function VerifyEmailPage() {
  const location = useLocation();
  const verificationStarted = useRef(false);
  const token = new URLSearchParams(location.search).get('token');
  const email = new URLSearchParams(location.search).get('email') || '';
  const delivery = new URLSearchParams(location.search).get('delivery');
  const recovery = new URLSearchParams(location.search).get('recovery');
  const initialMessage =
    delivery === 'failed'
      ? 'Your account was created, but email delivery was unavailable. Start Mailpit and select Resend verification.'
      : recovery === 'pending'
        ? 'This account is waiting for verification. Select Resend verification to receive a new link.'
        : 'Open Mailpit and click the verification link we sent.';
  const [state, setState] = useState(token ? 'verifying' : 'sent');
  const [message, setMessage] = useState(token ? 'Verifying your email…' : initialMessage);
  const [botToken, setBotToken] = useState('');
  const [botReset, setBotReset] = useState(0);

  useEffect(() => {
    if (!token || verificationStarted.current) return;
    verificationStarted.current = true;
    authService
      .verifyEmail(token)
      .then((result) => {
        setState('success');
        setMessage(result.message);
      })
      .catch((error) => {
        setState('error');
        setMessage(error.response?.data?.message || 'Unable to verify this email.');
      });
  }, [token]);

  const resend = async () => {
    if (!email) return;
    if (turnstileSiteKey && !botToken) {
      setMessage('Complete the bot verification first.');
      setState('error');
      return;
    }
    setState('verifying');
    try {
      const result = await authService.resendVerification(email, botToken || undefined);
      setMessage(result.message);
      setState('sent');
    } catch (error) {
      setBotToken('');
      setBotReset((value) => value + 1);
      setMessage(error.response?.data?.message || 'Unable to resend verification.');
      setState('error');
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-heading">
          <NHLogo />
          <h1>Email Verification</h1>
          <p role="status" className={state === 'error' ? 'form-error' : 'form-success'}>
            {message}
          </p>
        </div>
        {state === 'success' ? (
          <Link className="login-submit auth-link-button" to="/login">
            Continue to Login
          </Link>
        ) : (
          <>
            {!token && email && (
              <>
                <Turnstile action="resend_verification" onToken={setBotToken} resetKey={botReset} />
                <button className="login-submit" onClick={resend} disabled={state === 'verifying'}>
                  Resend verification
                </button>
              </>
            )}
            <div className="signup-copy">
              <a href="http://127.0.0.1:8025" target="_blank" rel="noreferrer">
                Open local Mailpit inbox
              </a>
            </div>
          </>
        )}
        <div className="signup-copy">
          <Link to="/login">Back to Login</Link>
        </div>
      </section>
    </main>
  );
}
