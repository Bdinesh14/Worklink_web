import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, Lock, CheckCircle2, UserPlus } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import './auth.css';

export const RegisterPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRole = location.state?.selectedRole || 'client';
  const { setProfileAndRole } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const validateForm = () => {
    let isValid = true;
    setNameError(''); setEmailError(''); setPhoneError(''); setPasswordError(''); setConfirmPasswordError('');

    if (!fullName.trim()) { setNameError('Full name is required'); isValid = false; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) { setEmailError('Email address is required'); isValid = false; }
    else if (!emailRegex.test(email.trim())) { setEmailError('Please enter a valid email address'); isValid = false; }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');
    if (!phoneNumber.trim()) { setPhoneError('Mobile number is required'); isValid = false; }
    else if (!phoneRegex.test(cleanPhone)) { setPhoneError('Please enter a valid 10-15 digit phone number'); isValid = false; }

    if (!password) { setPasswordError('Password is required'); isValid = false; }
    else if (password.length < 6) { setPasswordError('Password must be at least 6 characters'); isValid = false; }

    if (!confirmPassword) { setConfirmPasswordError('Please confirm your password'); isValid = false; }
    else if (password !== confirmPassword) { setConfirmPasswordError('Passwords do not match'); isValid = false; }

    return isValid;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      const profileData = {
        uid: firebaseUser.uid,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        role: selectedRole,
        createdAt: new Date().toISOString(),
      };

      const userRef = ref(database, `users/${firebaseUser.uid}`);
      await set(userRef, profileData);

      setProfileAndRole(profileData);
      showToast('Registration successful!', 'success');

      setTimeout(() => {
        if (selectedRole === 'client') {
          navigate('/hirer/home', { replace: true });
        } else {
          navigate('/worker/home', { replace: true });
        }
      }, 800);
    } catch (error: any) {
      console.error('Registration error:', error);
      let errMsg = 'Failed to register account. Please try again.';
      if (error.code === 'auth/email-already-in-use') errMsg = 'This email address is already in use by another account.';
      else if (error.code === 'auth/invalid-email') errMsg = 'The email address is invalid.';
      else if (error.code === 'auth/weak-password') errMsg = 'The password is too weak.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="split-layout">
      <div className="split-left">
        <div className="split-left-content">
          <h1 className="split-left-title">Join WorkLink</h1>
          <p className="split-left-desc">Create your account and start connecting with opportunities nearby instantly.</p>
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
          <div className="badge-container">
            <div className={`role-badge ${selectedRole === 'worker' ? 'worker-badge' : ''}`}>
              <span className={`role-badge-text ${selectedRole === 'worker' ? 'worker-badge-text' : ''}`}>
                REGISTERING AS {selectedRole.toUpperCase()}
              </span>
            </div>
          </div>

          <header className="auth-header">
            <div className="auth-logo-box">
              <span className="auth-logo-text">WL</span>
            </div>
            <h1 className="title">Create Account</h1>
            <p className="subtitle">Join WorkLink to find opportunities instantly.</p>
          </header>

          <form onSubmit={handleRegister}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={nameError}
              leftIcon={<User size={20} />}
            />

            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              type="email"
              leftIcon={<Mail size={20} />}
            />

            <Input
              label="Mobile Number"
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              error={phoneError}
              type="tel"
              leftIcon={<Phone size={20} />}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
              isPassword
              leftIcon={<Lock size={20} />}
            />

            <Input
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPasswordError}
              isPassword
              leftIcon={<Lock size={20} />}
              rightIcon={passwordsMatch ? <CheckCircle2 size={18} color="var(--color-success)" /> : undefined}
            />

            <Button
              type="submit"
              title="Register"
              loading={loading}
              icon={<UserPlus size={18} />}
              style={{ marginTop: 'var(--spacing-sm)' }}
            />
          </form>

          <p className="agreement-text">
            By registering, you agree to our <span className="accent-agreement">Terms of Service</span> and <span className="accent-agreement">Privacy Policy</span>.
          </p>

          <div className="footer-link-container">
            <span className="footer-text">Already have an account? </span>
            <Link to="/login" state={{ selectedRole }} className="sign-up-text">Log In</Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
