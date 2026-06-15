import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Hammer, ArrowLeft, Check, Star } from 'lucide-react';
import { Button } from '../components/Button';
import './auth.css';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
  rating: number;
}

export const RoleSelectionPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'client' | 'worker' | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const navigate = useNavigate();

  const testimonials: Testimonial[] = [
    {
      id: 0,
      quote: '"WorkLink helped me find my first client in 24 hours. The communication was so seamless!"',
      author: 'Sarah Jenkins',
      role: 'Interior Designer',
      rating: 5,
    },
    {
      id: 1,
      quote: '"I hired an electrician within 15 minutes to fix my shop wiring. Saved my business today!"',
      author: 'David Vance',
      role: 'Retail Store Owner',
      rating: 5,
    },
    {
      id: 2,
      quote: '"Great platform to get reliable carpentry jobs nearby. Highly recommend it to all workers."',
      author: 'Marcus Brody',
      role: 'Professional Carpenter',
      rating: 5,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const handleContinue = () => {
    if (selectedRole) {
      navigate('/login', { state: { selectedRole } });
    }
  };

  return (
    <div className="split-layout">
      <div className="split-left">
        <div className="split-left-content">
          <h1 className="split-left-title">Choose Your Path</h1>
          <p className="split-left-desc">Whether you need help or want to provide it, WorkLink gives you the tools you need.</p>
        </div>
      </div>
      <div className="split-right">
        <div className="role-selection-container animate-fade-in">
        {/* Header */}
        <header className="onboarding-header">
          <button className="icon-btn" onClick={() => navigate('/onboarding')}>
            <ArrowLeft size={22} color="var(--color-text-medium)" />
          </button>
          <div className="logo-row">
            <div className="logo-tiny"><span className="logo-tiny-text">WL</span></div>
            <h2 className="header-title">WorkLink</h2>
          </div>
          <div style={{ width: '40px' }} />
        </header>

        {/* Content */}
        <main className="role-content">
          <h1 className="title">Join as a Client or Worker</h1>
          <p className="subtitle">Select your role to start connecting with local opportunities.</p>

          <div className="roles-container">
            {/* Client Card */}
            <button
              className={`role-card ${selectedRole === 'client' ? 'active-card-client' : ''}`}
              onClick={() => setSelectedRole('client')}
            >
              <div className="card-header">
                <div className={`icon-box ${selectedRole === 'client' ? 'active-icon-client' : ''}`}>
                  <Briefcase size={28} color={selectedRole === 'client' ? '#FFF' : 'var(--color-primary)'} />
                </div>
                {selectedRole === 'client' && (
                  <div className="check-badge client-badge">
                    <Check size={14} color="#FFF" />
                  </div>
                )}
              </div>
              <div className="card-body">
                <h3 className="card-title">I want to hire</h3>
                <p className="card-description">
                  Post local jobs, browse skilled workers, and manage active service projects.
                </p>
              </div>
            </button>

            {/* Worker Card */}
            <button
              className={`role-card ${selectedRole === 'worker' ? 'active-card-worker' : ''}`}
              onClick={() => setSelectedRole('worker')}
            >
              <div className="card-header">
                <div className={`icon-box ${selectedRole === 'worker' ? 'active-icon-worker' : ''}`}>
                  <Hammer size={28} color={selectedRole === 'worker' ? '#FFF' : 'var(--color-success)'} />
                </div>
                {selectedRole === 'worker' && (
                  <div className="check-badge worker-badge">
                    <Check size={14} color="#FFF" />
                  </div>
                )}
              </div>
              <div className="card-body">
                <h3 className="card-title">I want to work</h3>
                <p className="card-description">
                  Find local service jobs, send custom work requests, and build your professional profile.
                </p>
              </div>
            </button>
          </div>

          {/* Testimonial */}
          <div className="testimonial-container">
            <span className="trusted-label">TRUSTED BY 10K+ PROFESSIONALS</span>
            <div className="testimonial-card animate-fade-in" key={activeTestimonial}>
              <div className="stars-row">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} size={14} color="#FBBF24" fill="#FBBF24" />
                ))}
              </div>
              <p className="quote-text">{testimonials[activeTestimonial].quote}</p>
              <p className="author-text">
                - {testimonials[activeTestimonial].author},{' '}
                <span className="author-role">{testimonials[activeTestimonial].role}</span>
              </p>
            </div>
          </div>
        </main>

        <footer className="role-footer">
          <Button
            title="Continue"
            onClick={handleContinue}
            disabled={selectedRole === null}
          />
        </footer>
      </div>
      </div>
    </div>
  );
};
