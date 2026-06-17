import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, Plus, Check, Lock, Hammer, Droplets, Zap, Paintbrush, Wrench } from 'lucide-react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Toast } from '../../components/Toast';
import '../home.css';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Carpentry: <Hammer size={20} color="var(--color-primary)" />,
  Plumbing: <Droplets size={20} color="#3B82F6" />,
  Electrical: <Zap size={20} color="#F59E0B" />,
  Painting: <Paintbrush size={20} color="#8B5CF6" />,
  Cleaning: <Wrench size={20} color="#10B981" />,
  Welding: <Zap size={20} color="#EF4444" />,
  Masonry: <Hammer size={20} color="#6B7280" />,
  Other: <Briefcase size={20} color="var(--color-text-medium)" />,
};

export const MyJobsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed' | 'completed'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = onValue(ref(database, 'jobs'), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(j => j.hirerUid === profile.uid)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setJobs(list);
      } else {
        setJobs([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [profile?.uid]);

  const handleStatusChange = async (jobId: string, newStatus: 'completed' | 'closed') => {
    try {
      await update(ref(database, `jobs/${jobId}`), { status: newStatus });
      setToastMsg(`Job status updated to ${newStatus}`);
    } catch (e) {
      console.error(e);
      setToastMsg('Failed to update job status');
    }
  };

  const getFilteredJobs = () => {
    if (activeTab === 'all') return jobs;
    return jobs.filter(j => j.status === activeTab);
  };

  const openCount = jobs.filter(j => j.status === 'open').length;
  const closedCount = jobs.filter(j => j.status === 'closed').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;

  return (
    <div className="home-container animate-fade-in">
      <Toast message={toastMsg} visible={!!toastMsg} onDismiss={() => setToastMsg(null)} type="success" />
      
      <header className="home-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="name-title" style={{ fontSize: '22px', margin: 0 }}>My Jobs</h1>
        </div>
        <button 
          className="post-job-btn bg-primary" 
          onClick={() => navigate('/hirer/post-job')}
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', justifyContent: 'center' }}
        >
          <Plus size={22} />
        </button>
      </header>

      {/* Tabs Container */}
      <div className="search-bar-container" style={{ paddingBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', width: '100%', padding: '4px 0' }}>
          <button 
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: activeTab === 'all' ? 'var(--color-primary)' : 'var(--color-bg-light)',
              color: activeTab === 'all' ? 'white' : 'var(--color-text-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('open')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: activeTab === 'open' ? 'var(--color-primary)' : 'var(--color-bg-light)',
              color: activeTab === 'open' ? 'white' : 'var(--color-text-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Open {openCount > 0 && <span style={{ backgroundColor: activeTab === 'open' ? 'white' : 'var(--color-border)', color: activeTab === 'open' ? 'var(--color-primary)' : 'var(--color-text-dark)', padding: '2px 6px', borderRadius: '50%', fontSize: '10px' }}>{openCount}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('closed')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: activeTab === 'closed' ? 'var(--color-primary)' : 'var(--color-bg-light)',
              color: activeTab === 'closed' ? 'white' : 'var(--color-text-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Closed {closedCount > 0 && <span style={{ backgroundColor: activeTab === 'closed' ? 'white' : 'var(--color-border)', color: activeTab === 'closed' ? 'var(--color-primary)' : 'var(--color-text-dark)', padding: '2px 6px', borderRadius: '50%', fontSize: '10px' }}>{closedCount}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: activeTab === 'completed' ? 'var(--color-primary)' : 'var(--color-bg-light)',
              color: activeTab === 'completed' ? 'white' : 'var(--color-text-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Completed {completedCount > 0 && <span style={{ backgroundColor: activeTab === 'completed' ? 'white' : 'var(--color-border)', color: activeTab === 'completed' ? 'var(--color-primary)' : 'var(--color-text-dark)', padding: '2px 6px', borderRadius: '50%', fontSize: '10px' }}>{completedCount}</span>}
          </button>
        </div>
      </div>

      <div className="list-container" style={{ marginTop: 'var(--spacing-md)' }}>
        {loading ? (
          <div className="loading-state">Loading jobs...</div>
        ) : getFilteredJobs().length === 0 ? (
          <div className="empty-state">
            <Briefcase size={40} color="var(--color-primary)" />
            <h3>No Jobs Found</h3>
            <p>No jobs match the selected filter.</p>
          </div>
        ) : (
          getFilteredJobs().map(job => (
            <div key={job.id} className="feed-card" style={{ flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-bg-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {CATEGORY_ICONS[job.category] || <Briefcase size={20} color="var(--color-text-medium)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 className="feed-title" style={{ margin: 0, fontSize: '16px' }}>{job.title}</h3>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-medium)', fontWeight: 600 }}>
                        {job.category}
                      </span>
                    </div>
                    <span className="category-badge" style={{
                      backgroundColor: job.status === 'open' ? 'rgba(16, 185, 129, 0.15)' : job.status === 'completed' ? '#EEF2FF' : 'var(--color-bg-light)',
                      color: job.status === 'open' ? 'var(--color-success)' : job.status === 'completed' ? 'var(--color-primary)' : 'var(--color-text-medium)',
                      margin: 0
                    }}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {job.description && (
                <p style={{ fontSize: '13px', color: 'var(--color-text-dark)', margin: '4px 0' }}>
                  {job.description}
                </p>
              )}
              
              <div className="meta-row" style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="meta-item">
                  <MapPin size={13} />
                  <span>{job.location}</span>
                </div>
                {job.urgency && (
                  <span className="category-badge" style={{
                    backgroundColor: job.urgency === 'Emergency' || job.urgency === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: job.urgency === 'Emergency' || job.urgency === 'High' ? '#EF4444' : '#F59E0B',
                    margin: 0,
                    fontSize: '10px'
                  }}>
                    {job.urgency}
                  </span>
                )}
              </div>
              
              <div className="card-bottom" style={{ marginTop: '4px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="rate-text" style={{ fontSize: '16px', fontWeight: 800 }}>
                  ₹{job.budget.toLocaleString('en-IN')} <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-medium)' }}>{job.budgetType}</span>
                </span>
                
                {job.status === 'open' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleStatusChange(job.id, 'completed')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: 'var(--color-success)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Check size={14} /> Complete
                    </button>
                    <button 
                      onClick={() => handleStatusChange(job.id, 'closed')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--color-error)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-error)',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Lock size={12} /> Close
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-medium)' }}>
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
