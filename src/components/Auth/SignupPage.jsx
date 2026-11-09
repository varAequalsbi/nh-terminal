import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { NHLogo } from '../Layout/Header';
import { authService } from '../../services/authService';
import Turnstile, { turnstileSiteKey } from './Turnstile';
import './login.css';

export default function SignupPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [botReset, setBotReset] = useState(0);
  const change = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setErrors({ ...errors, [event.target.name]: '', form: '' });
  };
  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    if (form.password.length < 12) next.password = 'Password must contain at least 12 characters';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    if (turnstileSiteKey && !botToken) next.form = 'Complete the bot verification first.';
    if (Object.keys(next).length) return setErrors(next);
    setPending(true);
    setErrors({});
    try {
      const data = await authService.signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        turnstileToken: botToken || undefined,
      });
      if (data.requiresVerification) {
        const delivery = data.verificationEmailDelivered === false ? '&delivery=failed' : '';
        navigate(`/verify-email?email=${encodeURIComponent(data.user.email)}${delivery}`, {
          replace: true,
        });
      } else {
        onLoginSuccess({ user: data.user });
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      setBotToken('');
      setBotReset((value) => value + 1);
      if (error.response?.data?.code === 'PENDING_ACCOUNT_EXISTS') {
        navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}&recovery=pending`, {
          replace: true,
        });
        return;
      }
      setErrors({
        form: error.response?.data?.message || 'Unable to create the account. Please try again.',
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
          <h1>Create Account</h1>
          <p>Join this local NH Terminal installation</p>
        </div>
        <form onSubmit={submit}>
          <label>
            Name
            <input name="name" autoComplete="name" value={form.name} onChange={change} />
            {errors.name && <small>{errors.name}</small>}
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={change}
            />
            {errors.email && <small>{errors.email}</small>}
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                value={form.password}
                onChange={change}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.password && <small>{errors.password}</small>}
          </label>
          <label>
            Confirm password
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={change}
            />
            {errors.confirmPassword && <small>{errors.confirmPassword}</small>}
          </label>
          {errors.form && (
            <small className="form-error" role="alert">
              {errors.form}
            </small>
          )}
          <Turnstile action="register" onToken={setBotToken} resetKey={botReset} />
          <button className="login-submit" disabled={pending}>
            {pending ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <div className="signup-copy">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </section>
    </main>
  );
}
