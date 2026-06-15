import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, database } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import './auth.css';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRole = location.state?.selectedRole || 'client';
  const { setProfileAndRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email address is required');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      const userRef = ref(database, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userProfile = snapshot.val();

        if (userProfile.role !== selectedRole) {
          await auth.signOut();
          const actualLabel = userProfile.role === 'client' ? 'Hirer' : 'Worker';
          showToast(`This account is registered as a ${actualLabel}. Please log in as a ${actualLabel}.`, 'error');
          setLoading(false);
          return;
        }

        setProfileAndRole(userProfile);
        showToast('Login successful!', 'success');

        setTimeout(() => {
          if (userProfile.role === 'client') {
            navigate('/hirer/home', { replace: true });
          } else {
            navigate('/worker/home', { replace: true });
          }
        }, 800);
      } else {
        const recoveredProfile = {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || '',
          email: firebaseUser.email || email.trim().toLowerCase(),
          phoneNumber: '',
          role: selectedRole,
          createdAt: new Date().toISOString(),
        };
        try {
          await set(userRef, recoveredProfile);
        } catch (_) {
          showToast('Account found but profile save failed. Check Firebase rules.', 'error');
          setLoading(false);
          return;
        }
        setProfileAndRole(recoveredProfile);
        showToast('Login successful!', 'success');
        setTimeout(() => {
          if (selectedRole === 'client') {
            navigate('/hirer/home', { replace: true });
          } else {
            navigate('/worker/home', { replace: true });
          }
        }, 800);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errMsg = 'Failed to sign in. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errMsg = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errMsg = 'Network error. Please check your internet connection.';
      }
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="split-layout">
      <div className="split-left">
        <div className="split-left-content">
          <h1 className="split-left-title">Welcome Back</h1>
          <p className="split-left-desc">Sign in to continue accessing your dashboard and managing your work.</p>
        </div>
      </div>
      <div className="split-right">
        <div className="auth-form-container animate-fade-in">
        <Toast
          message={toastMessage}
          type={toastType}
          visible={toastVisible}
          onDismiss={() => setToastVisible(false)}
        />

        <div className="auth-scroll-container">
          <div className="badge-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div className={`role-badge ${selectedRole === 'worker' ? 'worker-badge' : ''}`}>
              <span className={`role-badge-text ${selectedRole === 'worker' ? 'worker-badge-text' : ''}`}>
                LOGGING IN AS {selectedRole.toUpperCase()}
              </span>
            </div>
            <Link to="/select-role" className="sign-up-text" style={{ fontSize: '13px', fontWeight: 650 }}>
              Change Role
            </Link>
          </div>

          <header className="auth-header">
            <div className="auth-logo-box">
              <span className="auth-logo-text">WL</span>
            </div>
            <h1 className="title">WorkLink</h1>
            <p className="subtitle">Connecting potential to work.</p>
          </header>

          <form onSubmit={handleLogin} className="form-container">
            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              type="email"
              leftIcon={<Mail size={20} />}
            />

            <div className="password-header">
              <Link to="/forgot-password" className="forgot-btn">Forgot Password?</Link>
            </div>
            
            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
              isPassword
              leftIcon={<Lock size={20} />}
            />

            <Button
              type="submit"
              title="Login"
              loading={loading}
              icon={<LogIn size={18} />}
              style={{ marginTop: 'var(--spacing-sm)' }}
            />
          </form>

          <div className="footer-link-container">
            <span className="footer-text">Don't have an account? </span>
            <Link to="/register" state={{ selectedRole }} className="sign-up-text">Sign Up</Link>
          </div>

          <p className="agreement-text">Privacy Policy • Terms of Service</p>
        </div>
      </div>
      </div>
    </div>
  );
};
