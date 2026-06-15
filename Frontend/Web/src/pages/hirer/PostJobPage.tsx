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
const URGENCY_LEVELS = [
  { label: 'Low', desc: 'Flexible, no rush', color: '#10B981' },
  { label: 'Medium', desc: 'Within a few days', color: '#F59E0B' },
  { label: 'High', desc: 'Within 24 hours', color: '#EF4444' },
  { label: 'Emergency', desc: 'Right now, ASAP', color: '#7C3AED' },
];

export const PostJobPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedCategory = queryParams.get('cat') || '';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(preselectedCategory);
  const [description, setDescription] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [budgetType, setBudgetType] = useState<'fixed' | 'hourly'>('fixed');
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Job title is required';
    if (!category) e.category = 'Please select a category';
    if (!description.trim()) e.description = 'Description is required';
    if (!jobLocation.trim()) e.location = 'Location is required';
    if (!budget.trim() || isNaN(Number(budget))) e.budget = 'Enter a valid budget amount';
    if (!urgency) e.urgency = 'Please select urgency level';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !profile?.uid) return;

    setLoading(true);
    try {
      const newJobRef = push(ref(database, 'jobs'));
      await set(newJobRef, {
        title: title.trim(),
        category,
        description: description.trim(),
        location: jobLocation.trim(),
        budgetType,
        budget: Number(budget),
        urgency,
        hirerUid: profile.uid,
        hirerName: profile.fullName,
        hirerPhoneNumber: profile.phoneNumber || '',
        status: 'open',
        createdAt: new Date().toISOString(),
      });

      setToastMsg('Job posted successfully!');
      setTimeout(() => navigate('/hirer/jobs'), 1500);
    } catch (err) {
      console.error(err);
      setToastMsg('Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container animate-slide-up">
      <Toast message={toastMsg} visible={!!toastMsg} onDismiss={() => setToastMsg(null)} type="success" />

      <header className="home-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} color="var(--color-text-medium)" />
        </button>
        <h2 className="section-title">Post a Job</h2>
        <div style={{ width: 40 }} />
      </header>

      <div style={{ padding: 'var(--spacing-xl)', maxWidth: 600, margin: '0 auto', width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label className="input-label">Job Title</label>
            <input
              className={`search-input ${errors.title ? 'input-error' : ''}`}
              style={{ paddingLeft: 'var(--spacing-md)' }}
              placeholder="e.g. Fix leaking kitchen pipe"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <Dropdown
            label="Category"
            placeholder="Select job category"
            value={category}
            options={CATEGORIES.map(c => ({ label: c }))}
            onSelect={setCategory}
            error={errors.category}
          />

          <div>
            <label className="input-label">Description</label>
            <textarea
              className={`search-input ${errors.description ? 'input-error' : ''}`}
              style={{ padding: 'var(--spacing-sm) var(--spacing-md)', height: '120px', resize: 'vertical' }}
              placeholder="Describe the work needed in detail..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div>
            <label className="input-label">Location</label>
            <input
              className={`search-input ${errors.location ? 'input-error' : ''}`}
              style={{ paddingLeft: 'var(--spacing-md)' }}
              placeholder="e.g. Koramangala, Bangalore"
              value={jobLocation}
              onChange={e => setJobLocation(e.target.value)}
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>

          <div>
            <label className="input-label">Budget Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`btn ${budgetType === 'fixed' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => setBudgetType('fixed')}
              >
                Fixed Price
              </button>
              <button
                type="button"
                className={`btn ${budgetType === 'hourly' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => setBudgetType('hourly')}
              >
                Hourly Rate
              </button>
            </div>
          </div>

          <div>
            <label className="input-label">Amount (₹)</label>
            <input
              type="number"
              className={`search-input ${errors.budget ? 'input-error' : ''}`}
              style={{ paddingLeft: 'var(--spacing-md)' }}
              placeholder={budgetType === 'fixed' ? '1500' : '200'}
              value={budget}
              onChange={e => setBudget(e.target.value)}
            />
            {errors.budget && <span className="error-text">{errors.budget}</span>}
          </div>

          <Dropdown
            label="Urgency Level"
            placeholder="Select urgency level"
            value={urgency}
            options={URGENCY_LEVELS}
            onSelect={setUrgency}
            error={errors.urgency}
          />

          <Button title="Post Job" type="submit" loading={loading} style={{ marginTop: 'var(--spacing-md)' }} />
        </form>
      </div>
    </div>
  );
};
