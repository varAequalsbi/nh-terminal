import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../Common';
import { validatePassword } from '../../utils';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      localStorage.setItem('authToken', 'mock-token');
      onLoginSuccess();
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-bg-primary to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-bg-secondary border border-border-color rounded-lg p-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-color-gold mb-2">NH Terminal</h1>
            <p className="text-text-secondary">Enter Your Details Below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />

            {errors.submit && (
              <p className="text-color-danger text-sm">{errors.submit}</p>
            )}

            <a href="#" className="text-sm text-color-gold hover:text-opacity-80 inline-block">
              Forgot Password?
            </a>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
            >
              Log In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            Don't Have Account?{' '}
            <a href="#" className="text-color-gold hover:text-opacity-80 font-semibold">
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
