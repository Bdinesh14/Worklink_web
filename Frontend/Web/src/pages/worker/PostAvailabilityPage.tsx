import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { push, set, ref } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Dropdown } from '../../components/Dropdown';
import { Toast } from '../../components/Toast';
import '../home.css';

const CATEGORIES = ['Carpentry', 'Plumbing', 'Electrical', 'Cleaning', 'Painting', 'Welding', 'Masonry', 'Other'];
const AVAILABILITY_LEVELS = [
  { label: 'Available Now', desc: 'Ready to start immediately', color: '#10B981' },
  { label: 'Available Soon', desc: 'Can start within 24-48 hours', color: '#F59E0B' },
  { label: 'Available Weekends', desc: 'Only free on weekends', color: '#3B82F6' },
  { label: 'Flexible', desc: 'Can schedule based on job', color: '#8B5CF6' },
];

export const PostAvailabilityPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedCategory = queryParams.get('cat') || '';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(preselectedCategory);
  const [description, setDescription] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [rateType, setRateType] = useState<'fixed' | 'hourly'>('hourly');
  const [rate, setRate] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!category) e.category = 'Please select a category';
    if (!description.trim()) e.description = 'Description is required';
    if (!jobLocation.trim()) e.location = 'Location is required';
    if (!rate.trim() || isNaN(Number(rate))) e.rate = 'Enter a valid rate';
    if (!availability) e.availability = 'Please select availability';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !profile?.uid) return;

    setLoading(true);
    try {
      const newPostRef = push(ref(database, 'workerPosts'));
      await set(newPostRef, {
        title: title.trim(),
        category,
        description: description.trim(),
        location: jobLocation.trim(),
        rateType,
        rate: Number(rate),
        availability,
        workerUid: profile.uid,
        workerName: profile.fullName,
        workerPhoneNumber: profile.phoneNumber || '',
        status: 'open',
        createdAt: new Date().toISOString(),
      });

      setToastMsg('Availability posted successfully!');
      setTimeout(() => navigate('/worker/manage-reports'), 1500);
    } catch (err) {
      console.error(err);
      setToastMsg('Failed to post availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container animate-slide-up">
      <Toast message={toastMsg} visible={!!toastMsg} onDismiss={() => setToastMsg(null)} type="success" />

      <header className="home-header">
          <h1 className="name-title" style={{ fontSize: '22px', margin: 0 }}>Post Availability</h1>
        <div style={{ width: 40 }} />
      </header>

      <div style={{ padding: 'var(--spacing-xl)', maxWidth: 600, margin: '0 auto', width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label className="input-label">Professional Title</label>
            <input
              className={`search-input ${errors.title ? 'input-error' : ''}`}
              style={{ paddingLeft: 'var(--spacing-md)' }}
              placeholder="e.g. Expert Plumber — 5 yrs experience"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <Dropdown
            label="Service Category"
            placeholder="Select category"
            value={category}
            options={CATEGORIES.map(c => ({ label: c }))}
            onSelect={setCategory}
            error={errors.category}
          />

          <div>
            <label className="input-label">About your services</label>
            <textarea
              className={`search-input ${errors.description ? 'input-error' : ''}`}
              style={{ padding: 'var(--spacing-sm) var(--spacing-md)', height: '120px', resize: 'vertical' }}
              placeholder="Describe what you can do..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div>
            <label className="input-label">Work Location</label>
            <input
              className={`search-input ${errors.location ? 'input-error' : ''}`}
              style={{ paddingLeft: 'var(--spacing-md)' }}
              placeholder="e.g. HSR Layout, Bangalore"
              value={jobLocation}
              onChange={e => setJobLocation(e.target.value)}
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>

          <div>
            <label className="input-label">Rate Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`btn ${rateType === 'hourly' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, backgroundColor: rateType === 'hourly' ? 'var(--color-success)' : undefined, borderColor: rateType === 'hourly' ? 'var(--color-success)' : undefined }}
                onClick={() => setRateType('hourly')}
              >
                Hourly Rate
              </button>
              <button
                type="button"
                className={`btn ${rateType === 'fixed' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, backgroundColor: rateType === 'fixed' ? 'var(--color-success)' : undefined, borderColor: rateType === 'fixed' ? 'var(--color-success)' : undefined }}
                onClick={() => setRateType('fixed')}
              >
                Fixed Rate
              </button>
            </div>
          </div>

          <div>
            <label className="input-label">Amount (₹)</label>
            <input
              type="number"
              className={`search-input ${errors.rate ? 'input-error' : ''}`}
              style={{ paddingLeft: 'var(--spacing-md)' }}
              placeholder={rateType === 'fixed' ? '1500' : '200'}
              value={rate}
              onChange={e => setRate(e.target.value)}
            />
            {errors.rate && <span className="error-text">{errors.rate}</span>}
          </div>

          <Dropdown
            label="Availability"
            placeholder="Select your availability"
            value={availability}
            options={AVAILABILITY_LEVELS}
            onSelect={setAvailability}
            error={errors.availability}
          />

          <Button 
            title="Post Skills" 
            type="submit" 
            loading={loading} 
            style={{ marginTop: 'var(--spacing-md)', backgroundColor: 'var(--color-success)' }} 
          />
        </form>
      </div>
    </div>
  );
};
