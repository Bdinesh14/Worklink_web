import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, MessageSquare, ArrowRight, X } from 'lucide-react';
import { Button } from '../components/Button';
import './auth.css';

interface Slide {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
}

export const OnboardingPage: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const navigate = useNavigate();

  const slides: Slide[] = [
    {
      id: 0,
      title: 'Real-time Hiring',
      description: 'Get instant matches for your local projects, home repairs, or freelance tasks in real-time.',
      icon: (
        <div className="icon-wrapper" style={{ backgroundColor: '#EEF2FF' }}>
          <Clock size={64} color="var(--color-primary)" />
        </div>
      ),
      accentColor: 'var(--color-primary)',
    },
    {
      id: 1,
      title: 'Nearby Workers',
      description: 'Find and connect with highly skilled, verified professionals situated right around your corner.',
      icon: (
        <div className="icon-wrapper" style={{ backgroundColor: '#ECFDF5' }}>
          <MapPin size={64} color="var(--color-success)" />
        </div>
      ),
      accentColor: 'var(--color-success)',
    },
    {
      id: 2,
      title: 'Fast Communication',
      description: 'Chat instantly, share specific work details, and align on rates safely within our built-in secure messenger.',
      icon: (
        <div className="icon-wrapper" style={{ backgroundColor: '#FFFBEB' }}>
          <MessageSquare size={64} color="var(--color-warning)" />
        </div>
      ),
      accentColor: 'var(--color-warning)',
    },
  ];

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide(activeSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    navigate('/select-role', { replace: true });
  };

  return (
    <div className="split-layout">
      <div className="split-left">
        <div className="split-left-content">
          <h1 className="split-left-title">Welcome to WorkLink</h1>
          <p className="split-left-desc">Your ultimate platform to connect with skilled workers and local clients in real-time.</p>
        </div>
      </div>
      <div className="split-right">
        <div className="onboarding-container animate-fade-in">
        {/* Header */}
        <header className="onboarding-header">
          <button className="icon-btn" onClick={completeOnboarding}>
            <X size={22} color="var(--color-text-medium)" />
          </button>
          <h2 className="header-title">WorkLink</h2>
          <button className="skip-btn" onClick={completeOnboarding}>Skip</button>
        </header>

        {/* Carousel Content */}
        <main className="slides-container">
          <div className="slide animate-fade-in" key={activeSlide}>
            <div className="graphic-container">
              {slides[activeSlide].icon}
            </div>
            <div className="text-container">
              <h1 className="slide-title">{slides[activeSlide].title}</h1>
              <p className="slide-description">{slides[activeSlide].description}</p>
            </div>
          </div>
        </main>

        {/* Footer Controls */}
        <footer className="onboarding-footer">
          <div className="dots-container">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`dot ${index === activeSlide ? 'active-dot' : ''}`}
                style={index === activeSlide ? { backgroundColor: slide.accentColor } : {}}
              />
            ))}
          </div>

          <Button
            title={activeSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
            onClick={handleNext}
            icon={activeSlide !== slides.length - 1 ? <ArrowRight size={18} /> : undefined}
            style={activeSlide === slides.length - 1 ? { backgroundColor: 'var(--color-primary)' } : {}}
          />
        </footer>
      </div>
      </div>
    </div>
  );
};
