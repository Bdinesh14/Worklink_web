import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Check, X, Briefcase, Phone, MessageSquare } from 'lucide-react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Toast } from '../../components/Toast';
import '../home.css';

const AVATAR_COLORS = ['#10B981', '#0061C9', '#8B5CF6', '#EF4444', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6'];
const getAvatarColor = (uid: string) => AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'accepted':
      return { backgroundColor: '#ECFDF5', color: 'var(--color-success)', border: 'none' };
    case 'rejected':
      return { backgroundColor: '#FEE2E2', color: 'var(--color-error)', border: 'none' };
    default:
      return { backgroundColor: '#FFFBEB', color: 'var(--color-warning)', border: 'none' };
  }
};

export const WorkerApplicationsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = onValue(ref(database, 'requests'), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(r => r.workerUid === profile.uid)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(list);
      } else {
        setRequests([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [profile?.uid]);

  const handleStatusChange = async (reqId: string, status: 'accepted' | 'rejected') => {
    try {
      await update(ref(database, `requests/${reqId}`), { status });
      setToastMsg(`Request ${status}`);
    } catch (e) {
      console.error(e);
      setToastMsg('Failed to update status');
    }
  };

  const getFilteredRequests = () => {
    if (activeTab === 'received') {
      return requests.filter(r => r.type === 'hirer-to-worker');
    } else {
      return requests.filter(r => r.type === 'worker-to-hirer');
    }
  };

  const filteredRequests = getFilteredRequests();

  return (
    <div className="home-container animate-fade-in">
      <Toast message={toastMsg} visible={!!toastMsg} onDismiss={() => setToastMsg(null)} type="info" />
      <header className="home-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} color="var(--color-text-medium)" />
          </button>
          <h1 className="name-title" style={{ fontSize: '22px', margin: 0 }}>Applications</h1>
        </div>
        <div style={{ width: 40 }} />
      </header>

      {/* Tabs segment */}
      <div style={{ padding: 'var(--spacing-md) var(--spacing-xl)', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('received')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'received' ? 'var(--color-success)' : 'var(--color-bg-light)',
            color: activeTab === 'received' ? 'white' : 'var(--color-text-medium)',
            transition: 'background-color 0.2s, color 0.2s',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          Received
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'sent' ? 'var(--color-success)' : 'var(--color-bg-light)',
            color: activeTab === 'sent' ? 'white' : 'var(--color-text-medium)',
            transition: 'background-color 0.2s, color 0.2s',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          Sent
        </button>
      </div>

      <div className="list-container" style={{ marginTop: 'var(--spacing-sm)' }}>
        {loading ? (
          <div className="loading-state">Loading applications...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} color="var(--color-success)" />
            <h3>No Applications</h3>
            <p>No {activeTab} applications found.</p>
          </div>
        ) : (
          filteredRequests.map(req => {
            const displayUser = activeTab === 'received' ? req.hirerName : req.workerName;
            const displayUid = activeTab === 'received' ? req.hirerUid : req.workerUid;
            const initials = displayUser ? displayUser.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?';
            const avatarColor = getAvatarColor(displayUid || '1');
            const badgeStyle = getStatusBadgeStyle(req.status);
            
            return (
              <div key={req.id} className="feed-card" style={{ flexDirection: 'column', gap: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '16px',
                      flexShrink: 0
                    }}>
                      {initials}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-dark)', margin: '0 0 2px 0' }}>
                        {displayUser}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-medium)', fontSize: '13px' }}>
                        <Briefcase size={14} />
                        <span>{req.jobTitle || req.workerPostTitle || 'General Service'}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-medium)', marginTop: '6px' }}>
                        {formatDate(req.createdAt)}
                      </div>
                    </div>
                  </div>
                  <span className="category-badge" style={{ ...badgeStyle, margin: 0, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>

                {activeTab === 'received' && req.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 12, marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                    <button className="btn btn-outline" style={{ flex: 1, borderColor: 'var(--color-error)', color: 'var(--color-error)', height: '36px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }} onClick={() => handleStatusChange(req.id, 'rejected')}>
                      <X size={16} /> Reject
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--color-success)', height: '36px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }} onClick={() => handleStatusChange(req.id, 'accepted')}>
                      <Check size={16} /> Accept
                    </button>
                  </div>
                )}

                {req.status === 'accepted' && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                    {(activeTab === 'received' ? req.hirerPhoneNumber : req.hirerPhoneNumber) && (
                      <a
                        href={`tel:${activeTab === 'received' ? req.hirerPhoneNumber : req.hirerPhoneNumber}`}
                        style={{
                          flex: 1, height: '36px', borderRadius: '10px',
                          border: '1.5px solid var(--color-success)',
                          backgroundColor: 'rgba(16,185,129,0.08)',
                          color: 'var(--color-success)', fontWeight: 700, fontSize: '13px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', gap: '5px', textDecoration: 'none'
                        }}
                      >
                        <Phone size={14} /> Call
                      </a>
                    )}
                    <button className="btn btn-primary" style={{ flex: 2, height: '36px', padding: 0, backgroundColor: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }} onClick={() => {
                      const otherUid = req.hirerUid;
                      const otherName = req.hirerName;
                      const chatId = [profile?.uid, otherUid].sort().join('_');
                      navigate(`/worker/chat/${chatId}?name=${encodeURIComponent(otherName || 'Hirer')}`);
                    }}>
                      <MessageSquare size={14} /> Message Hirer
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

