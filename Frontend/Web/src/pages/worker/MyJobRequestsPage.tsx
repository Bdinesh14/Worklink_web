import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Check, Lock, Calendar, MessageSquare, Hammer, Droplets, Zap, Paintbrush, Wrench, Phone } from 'lucide-react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Toast } from '../../components/Toast';
import '../home.css';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Carpentry: <Hammer size={20} color="var(--color-success)" />,
  Plumbing: <Droplets size={20} color="#3B82F6" />,
  Electrical: <Zap size={20} color="#F59E0B" />,
  Painting: <Paintbrush size={20} color="#8B5CF6" />,
  Cleaning: <Wrench size={20} color="#10B981" />,
  Welding: <Zap size={20} color="#EF4444" />,
  Masonry: <Hammer size={20} color="#6B7280" />,
  Other: <Briefcase size={20} color="var(--color-text-medium)" />,
};

export const MyJobRequestsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed' | 'completed'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = onValue(ref(database, 'requests'), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(r => r.workerUid === profile.uid && r.type === 'worker-to-hirer')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(list);
      } else {
        setRequests([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [profile?.uid]);

  const handleStatusChange = async (reqId: string, newStatus: 'completed' | 'closed') => {
    try {
      await update(ref(database, `requests/${reqId}`), { status: newStatus });
      setToastMsg(`Request marked as ${newStatus}`);
    } catch (e) {
      console.error(e);
      setToastMsg('Failed to update request status');
    }
  };

  const getFilteredRequests = () => {
    if (activeTab === 'all') return requests;
    if (activeTab === 'open') {
      return requests.filter(r => r.status === 'pending' || r.status === 'accepted');
    }
    if (activeTab === 'closed') {
      return requests.filter(r => r.status === 'rejected' || r.status === 'closed');
    }
    return requests.filter(r => r.status === 'completed');
  };

  const openCount = requests.filter(r => r.status === 'pending' || r.status === 'accepted').length;
  const closedCount = requests.filter(r => r.status === 'rejected' || r.status === 'closed').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="home-container animate-fade-in">
      <Toast message={toastMsg} visible={!!toastMsg} onDismiss={() => setToastMsg(null)} type="success" />

      <header className="home-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="name-title" style={{ fontSize: '22px', margin: 0 }}>My Job Applications</h1>
        </div>
        <div style={{ width: 40 }} />
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
              backgroundColor: activeTab === 'all' ? 'var(--color-success)' : 'var(--color-bg-light)',
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
              backgroundColor: activeTab === 'open' ? 'var(--color-success)' : 'var(--color-bg-light)',
              color: activeTab === 'open' ? 'white' : 'var(--color-text-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Open {openCount > 0 && <span style={{ backgroundColor: activeTab === 'open' ? 'white' : 'var(--color-border)', color: activeTab === 'open' ? 'var(--color-success)' : 'var(--color-text-dark)', padding: '2px 6px', borderRadius: '50%', fontSize: '10px' }}>{openCount}</span>}
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
              backgroundColor: activeTab === 'closed' ? 'var(--color-success)' : 'var(--color-bg-light)',
              color: activeTab === 'closed' ? 'white' : 'var(--color-text-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Closed {closedCount > 0 && <span style={{ backgroundColor: activeTab === 'closed' ? 'white' : 'var(--color-border)', color: activeTab === 'closed' ? 'var(--color-success)' : 'var(--color-text-dark)', padding: '2px 6px', borderRadius: '50%', fontSize: '10px' }}>{closedCount}</span>}
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
              backgroundColor: activeTab === 'completed' ? 'var(--color-success)' : 'var(--color-bg-light)',
              color: activeTab === 'completed' ? 'white' : 'var(--color-text-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Completed {completedCount > 0 && <span style={{ backgroundColor: activeTab === 'completed' ? 'white' : 'var(--color-border)', color: activeTab === 'completed' ? 'var(--color-success)' : 'var(--color-text-dark)', padding: '2px 6px', borderRadius: '50%', fontSize: '10px' }}>{completedCount}</span>}
          </button>
        </div>
      </div>

      <div className="list-container" style={{ marginTop: 'var(--spacing-md)' }}>
        {loading ? (
          <div className="loading-state">Loading applications...</div>
        ) : getFilteredRequests().length === 0 ? (
          <div className="empty-state">
            <Briefcase size={40} color="var(--color-success)" />
            <h3>No Applications Found</h3>
            <p>No applications match the selected filter.</p>
          </div>
        ) : (
          getFilteredRequests().map(req => (
            <div key={req.id} className="feed-card" style={{ flexDirection: 'column', gap: '8px', padding: '16px' }}>
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
                  {CATEGORY_ICONS[req.category] || CATEGORY_ICONS['Other']}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 className="feed-title" style={{ margin: 0, fontSize: '16px' }}>{req.jobTitle || 'General Service'}</h3>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-medium)', fontWeight: 600 }}>
                        Hirer: {req.hirerName}
                      </span>
                    </div>
                    <span className="category-badge" style={{
                      backgroundColor: req.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : req.status === 'accepted' ? 'rgba(16, 185, 129, 0.15)' : req.status === 'completed' ? '#EEF2FF' : 'rgba(239, 68, 68, 0.15)',
                      color: req.status === 'pending' ? 'var(--color-warning)' : req.status === 'accepted' ? 'var(--color-success)' : req.status === 'completed' ? 'var(--color-primary)' : 'var(--color-error)',
                      margin: 0
                    }}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="meta-row" style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-medium)' }}>
                  <Calendar size={13} />
                  <span>Applied on {formatDate(req.createdAt)}</span>
                </div>
              </div>
              
              <div className="card-bottom" style={{ marginTop: '4px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
                {req.status === 'accepted' ? (
                  <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {req.hirerPhoneNumber && (
                        <a
                          href={`tel:${req.hirerPhoneNumber}`}
                          style={{
                            padding: '6px 12px', borderRadius: '10px',
                            border: '1.5px solid var(--color-success)',
                            backgroundColor: 'rgba(16,185,129,0.08)',
                            color: 'var(--color-success)', fontWeight: 700,
                            fontSize: '12px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            textDecoration: 'none'
                          }}
                        >
                          <Phone size={13} /> Call
                        </a>
                      )}
                      <button 
                        onClick={() => {
                          const chatId = [profile?.uid, req.hirerUid].sort().join('_');
                          navigate(`/worker/chat/${chatId}?name=${encodeURIComponent(req.hirerName || 'Hirer')}`);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: '#ECFDF5',
                          color: 'var(--color-success)',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <MessageSquare size={14} /> Message Hirer
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleStatusChange(req.id, 'completed')}
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
                        onClick={() => handleStatusChange(req.id, 'closed')}
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
                  </div>
                ) : req.status === 'pending' ? (
                  <span style={{ fontSize: '12px', color: 'var(--color-text-medium)' }}>
                    Waiting for Hirer to review your application.
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--color-text-medium)' }}>
                    Status updated.
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

