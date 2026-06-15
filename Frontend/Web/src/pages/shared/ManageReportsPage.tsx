import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Trash2, MapPin, Calendar, AlertTriangle, Hammer, Droplets, Zap, Paintbrush, Wrench, X, User } from 'lucide-react';
import { ref, onValue, remove, get } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Toast } from '../../components/Toast';
import '../home.css';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Carpentry: <Hammer size={18} color="var(--color-primary)" />,
  Plumbing: <Droplets size={18} color="#3B82F6" />,
  Electrical: <Zap size={18} color="#F59E0B" />,
  Painting: <Paintbrush size={18} color="#8B5CF6" />,
  Cleaning: <Wrench size={18} color="#10B981" />,
  Welding: <Zap size={18} color="#EF4444" />,
  Masonry: <Hammer size={18} color="#6B7280" />,
  Other: <Briefcase size={18} color="var(--color-text-medium)" />,
};

const formatDate = (ds?: string) => {
  if (!ds) return '';
  return new Date(ds).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, message, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
  }}>
    <div style={{
      backgroundColor: 'var(--color-bg-card)', borderRadius: '20px',
      padding: '28px 24px', maxWidth: '360px', width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center'
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
      }}>
        <AlertTriangle size={28} color="var(--color-error)" />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-dark)', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: 'var(--color-text-medium)', margin: '0 0 24px', lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '12px', borderRadius: '12px',
            border: '1.5px solid var(--color-border)', backgroundColor: 'transparent',
            color: 'var(--color-text-dark)', fontWeight: 700, fontSize: '14px', cursor: 'pointer'
          }}
        >
          <X size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, padding: '12px', borderRadius: '12px',
            border: 'none', backgroundColor: 'var(--color-error)',
            color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer'
          }}
        >
          <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Delete
        </button>
      </div>
    </div>
  </div>
);

export const ManageReportsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'requests'>('posts');
  
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string; isRequest: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isWorker = profile?.role === 'worker';
  const accentColor = isWorker ? 'var(--color-success)' : 'var(--color-primary)';
  const dbPath = isWorker ? 'workerPosts' : 'jobs';

  useEffect(() => {
    if (!profile?.uid) return;
    
    // Fetch user posts
    const unsubPosts = onValue(ref(database, dbPath), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(item => isWorker ? item.workerUid === profile.uid : item.hirerUid === profile.uid)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(list);
      } else {
        setPosts([]);
      }
    });

    // Fetch accepted requests
    const unsubRequests = onValue(ref(database, 'requests'), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(r => (isWorker ? r.workerUid === profile.uid : r.hirerUid === profile.uid) && r.status === 'accepted')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAcceptedRequests(list);
      } else {
        setAcceptedRequests([]);
      }
      setLoading(false);
    });

    return () => {
      unsubPosts();
      unsubRequests();
    };
  }, [profile?.uid, isWorker, dbPath]);

  const handleDeleteRequest = (item: any, isRequest: boolean) => {
    const title = isRequest 
      ? (item.jobTitle || item.workerPostTitle || 'Job Engagement')
      : item.title;
    setDeleteConfirm({ id: item.id, title, isRequest });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || !profile?.uid) return;
    setDeleting(true);
    const { id: itemId, isRequest } = deleteConfirm;
    setDeleteConfirm(null);

    try {
      if (isRequest) {
        // Find the specific request details to delete chat
        const reqRef = ref(database, `requests/${itemId}`);
        const reqSnap = await get(reqRef);
        if (reqSnap.exists()) {
          const reqVal = reqSnap.val();
          const chatId = [reqVal.hirerUid, reqVal.workerUid].sort().join('_');
          
          // Delete request and chat
          await remove(ref(database, `requests/${itemId}`));
          await remove(ref(database, `chats/${chatId}`));
        } else {
          await remove(ref(database, `requests/${itemId}`));
        }
        setToastType('success');
        setToastMsg('Engagement ended and related chat history removed.');
      } else {
        // Cascade delete for posts (existing logic)
        const requestsSnap = await get(ref(database, 'requests'));
        const relatedRequests: string[] = [];
        const relatedChatIds = new Set<string>();

        if (requestsSnap.exists()) {
          Object.entries(requestsSnap.val()).forEach(([reqId, reqVal]: any) => {
            const isRelated = isWorker
              ? reqVal.workerPostId === itemId
              : reqVal.jobId === itemId;

            if (isRelated) {
              relatedRequests.push(reqId);
              const chatId = [reqVal.hirerUid, reqVal.workerUid].sort().join('_');
              relatedChatIds.add(chatId);
            }
          });
        }

        for (const reqId of relatedRequests) {
          await remove(ref(database, `requests/${reqId}`));
        }

        for (const chatId of relatedChatIds) {
          await remove(ref(database, `chats/${chatId}`));
        }

        await remove(ref(database, `${dbPath}/${itemId}`));
        setToastType('success');
        setToastMsg('Deleted post and all related applications/chats.');
      }
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMsg('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'open' || status === 'accepted') return { backgroundColor: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' };
    if (status === 'completed') return { backgroundColor: '#EEF2FF', color: 'var(--color-primary)' };
    return { backgroundColor: 'var(--color-bg-light)', color: 'var(--color-text-medium)' };
  };

  return (
    <div className="home-container animate-fade-in">
      <Toast message={toastMsg} visible={!!toastMsg} onDismiss={() => setToastMsg(null)} type={toastType} />
      {deleteConfirm && (
        <ConfirmDialog
          title={deleteConfirm.isRequest ? "End Engagement?" : "Delete Post?"}
          message={deleteConfirm.isRequest 
            ? `Are you sure you want to end the engagement for "${deleteConfirm.title}"? This will delete the request and its chat conversation.`
            : `Deleting "${deleteConfirm.title}" will permanently remove the post, all applications, and all related chat conversations.`
          }
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <header className="home-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} color="var(--color-text-medium)" />
          </button>
          <h1 className="name-title" style={{ fontSize: '22px', margin: 0 }}>Manage Reports</h1>
        </div>
      </header>

      {/* Tabs Segment */}
      <div style={{ padding: 'var(--spacing-md) var(--spacing-xl)', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('posts')}
          style={{
            flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
            backgroundColor: activeTab === 'posts' ? accentColor : 'var(--color-white)',
            color: activeTab === 'posts' ? 'white' : 'var(--color-text-dark)',
            fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          My Posts ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
            backgroundColor: activeTab === 'requests' ? accentColor : 'var(--color-white)',
            color: activeTab === 'requests' ? 'white' : 'var(--color-text-dark)',
            fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          Accepted Jobs ({acceptedRequests.length})
        </button>
      </div>

      {/* Info Banner */}
      <div style={{
        margin: '0 var(--spacing-xl) var(--spacing-md)',
        padding: '12px 16px', borderRadius: '12px',
        backgroundColor: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
        display: 'flex', alignItems: 'flex-start', gap: '10px'
      }}>
        <AlertTriangle size={16} color="var(--color-error)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0, lineHeight: 1.5 }}>
          {activeTab === 'posts' 
            ? "Deleting a post removes it permanently along with all applications and chat conversations linked to it."
            : "Ending an engagement removes the job request and deletes all chat history associated with it."
          }
        </p>
      </div>

      <div className="list-container" style={{ marginTop: 0 }}>
        {loading ? (
          <div className="loading-state">Loading reports...</div>
        ) : activeTab === 'posts' ? (
          posts.length === 0 ? (
            <div className="empty-state">
              <Briefcase size={40} color={accentColor} />
              <h3>No Posts Yet</h3>
              <p>{isWorker ? 'Post your skills to see them here.' : 'Post a job to see it here.'}</p>
            </div>
          ) : (
            posts.map(item => (
              <div key={item.id} className="feed-card" style={{ flexDirection: 'column', gap: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      backgroundColor: 'var(--color-bg-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {CATEGORY_ICONS[item.category] || <Briefcase size={18} color="var(--color-text-medium)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-dark)', margin: '0 0 4px' }}>
                        {item.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="category-badge" style={{ ...getStatusStyle(item.status), margin: 0, padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-medium)', fontWeight: 600 }}>
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRequest(item, false)}
                    disabled={deleting}
                    style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      border: '1px solid rgba(239,68,68,0.3)',
                      backgroundColor: 'rgba(239,68,68,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={16} color="var(--color-error)" />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                  {item.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-medium)' }}>
                      <MapPin size={12} />
                      <span>{item.location}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-medium)' }}>
                    <Calendar size={12} />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  {(item.budget || item.rate) && (
                    <span style={{ fontSize: '13px', fontWeight: 800, color: accentColor, marginLeft: 'auto' }}>
                      ₹{(item.budget || item.rate).toLocaleString('en-IN')}
                      {(item.budgetType === 'hourly' || item.rateType === 'hourly') && '/hr'}
                    </span>
                  )}
                </div>

                {item.description && (
                  <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0, lineHeight: 1.5 }}>
                    {item.description.length > 120 ? item.description.slice(0, 120) + '…' : item.description}
                  </p>
                )}
              </div>
            ))
          )
        ) : acceptedRequests.length === 0 ? (
          <div className="empty-state">
            <Briefcase size={40} color={accentColor} />
            <h3>No Accepted Jobs</h3>
            <p>Active accepted request reports will appear here.</p>
          </div>
        ) : (
          acceptedRequests.map(item => (
            <div key={item.id} className="feed-card" style={{ flexDirection: 'column', gap: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    backgroundColor: 'var(--color-bg-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Briefcase size={18} color={accentColor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-dark)', margin: '0 0 4px' }}>
                      {item.jobTitle || item.workerPostTitle || 'Job Engagement'}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="category-badge" style={{ ...getStatusStyle(item.status), margin: 0, padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-medium)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} />
                        {isWorker ? `Client: ${item.hirerName}` : `Worker: ${item.workerName}`}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRequest(item, true)}
                  disabled={deleting}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    border: '1px solid rgba(239,68,68,0.3)',
                    backgroundColor: 'rgba(239,68,68,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s'
                  }}
                  title="Cancel/End engagement"
                >
                  <Trash2 size={16} color="var(--color-error)" />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-medium)' }}>
                  <Calendar size={12} />
                  <span>Accepted: {formatDate(item.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
