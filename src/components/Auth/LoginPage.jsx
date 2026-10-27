import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NHLogo } from '../Layout/Header';
import { validatePassword } from '../../utils';
import { authService } from '../../services/authService';
import Turnstile, { turnstileSiteKey } from './Turnstile';
import './login.css';

export default function LoginPage({ onLoginSuccess }) {
  const isClientPreview = import.meta.env.VITE_DEMO_PREVIEW === 'true';
  const demoAccount = { email: 'admin@nhterminal.local', password: 'NHAdmin1234!' };
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [botReset, setBotReset] = useState(0);
  const change = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };
  const authenticate = async (credentials) => {
    if (turnstileSiteKey && !botToken) {
      setErrors({ form: 'Complete the bot verification first.' });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const data = await authService.login(
        credentials.email,
        credentials.password,
        botToken || undefined
      );
      onLoginSuccess({ user: data.user });
      navigate('/dashboard');
    } catch (error) {
      setErrors({ form: error.response?.data?.message || 'Unable to sign in. Please try again.' });
      setBotToken('');
      setBotReset((value) => value + 1);
    } finally {
      setIsLoading(false);
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!formData.email) next.email = 'Email is required';
    if (!validatePassword(formData.password))
      next.password = 'Password must be at least 12 characters';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    await authenticate(formData);
  };
  const useDemoAccount = () => {
    setFormData(demoAccount);
    authenticate(demoAccount);
  };
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-heading">
          <NHLogo />
          <h1>NH Terminal</h1>
          <p>Enter Your Details Below</p>
        </div>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
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
                placeholder="••••••••"
                value={formData.password}
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
          {location.state?.message && !errors.form && (
            <small className="form-success" role="status">
              {location.state.message}
            </small>
          )}
          {errors.form && <small>{errors.form}</small>}
          {!isClientPreview && (
            <Link className="forgot-link" to="/forgot-password">
              Forgot Password?
            </Link>
          )}
          <Turnstile action="login" onToken={setBotToken} resetKey={botReset} />
          <button className="login-submit" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Log In'}
          </button>
          <button
            type="button"
            className="demo-login"
            disabled={isLoading}
            onClick={useDemoAccount}
          >
            {isLoading ? 'Signing in...' : 'Use Demo Account'}
          </button>
        </form>
        <div className="demo-credentials">
          <b>Demo administrator</b>
          <span>{demoAccount.email}</span>
          <span>{demoAccount.password}</span>
        </div>
        {!isClientPreview && (
          <div className="signup-copy">
            Don&apos;t Have Account? <Link to="/signup">Sign Up</Link>
          </div>
        )}
      </section>
    </main>
  );
}
