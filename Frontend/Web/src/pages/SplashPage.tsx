import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export const SplashPage: React.FC = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation
    const duration = 1800;
    const interval = 20;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);
      if (currentStep >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        const onboardingCompleted = localStorage.getItem('hasCompletedOnboarding');

        if (user) {
          if (role === 'client') {
            navigate('/hirer/home', { replace: true });
          } else if (role === 'worker') {
            navigate('/worker/home', { replace: true });
          } else {
            navigate('/select-role', { replace: true });
          }
        } else {
          if (onboardingCompleted === 'true') {
            navigate('/select-role', { replace: true });
          } else {
            navigate('/onboarding', { replace: true });
          }
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [loading, user, role, navigate]);

  return (
    <div className="splash-container">
      <div className="splash-content animate-slide-up">
        <div className="logo-box-lg">
          <div className="logo-inner">
            <span className="logo-text">WL</span>
          </div>
        </div>
        <h1 className="splash-title">WorkLink</h1>
        <p className="splash-subtitle">Hire Nearby Workers Instantly</p>
      </div>

      <div className="loader-container">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="version-text">v 1.0.4 • Secure & Trusted</p>
      </div>
    </div>
  );
};
