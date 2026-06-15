import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Lock } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import './auth.css';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email address is required');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      showToast('Password reset link sent to your email', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      showToast('Failed to send reset email. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-layout">
      <div className="split-left">
        <div className="split-left-content">
          <h1 className="split-left-title">Reset Password</h1>
          <p className="split-left-desc">Get back into your account securely.</p>
        </div>
      </div>
      <div className="split-right">
        <div className="auth-form-container animate-fade-in">
        <Toast message={toastMessage} type={toastType} visible={toastVisible} onDismiss={() => setToastVisible(false)} />

        <header className="onboarding-header">
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} color="var(--color-text-medium)" />
          </button>
          <h2 className="header-title">WorkLink</h2>
          <div style={{ width: '40px' }} />
        </header>

        <div className="auth-scroll-container">
          <div className="auth-header" style={{ marginTop: 'var(--spacing-xl)' }}>
            <div className="auth-logo-box" style={{ backgroundColor: 'var(--color-warning)' }}>
              <Lock size={28} color="#fff" />
            </div>
            <h1 className="title">Reset Password</h1>
            <p className="subtitle">Enter your email to receive a reset link.</p>
          </div>

          <form onSubmit={handleReset}>
            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              type="email"
              leftIcon={<Mail size={20} />}
            />

            <Button
              type="submit"
              title="Send Reset Link"
              loading={loading}
              style={{ marginTop: 'var(--spacing-md)' }}
            />
          </form>

          <div className="footer-link-container" style={{ marginTop: 'var(--spacing-xl)' }}>
            <span className="footer-text">Remember your password? </span>
            <Link to="/login" className="sign-up-text">Log In</Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
