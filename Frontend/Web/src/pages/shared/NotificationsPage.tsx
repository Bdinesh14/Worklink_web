import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Briefcase, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { ref, onValue, update, set } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Toast } from '../../components/Toast';
import '../home.css';

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const NotificationsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isWorker = profile?.role === 'worker';

  useEffect(() => {
    if (!profile?.uid) return;

    const unsub = onValue(ref(database, 'requests'), (snap) => {
      if (snap.exists()) {
        const all = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(r => {
            if (isWorker) {
              // Worker sees: hirer-to-worker requests sent TO them
              return r.workerUid === profile.uid && r.type === 'hirer-to-worker';
            } else {
              // Hirer sees: worker-to-hirer requests sent TO them
              return r.hirerUid === profile.uid && r.type === 'worker-to-hirer';
            }
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(all);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [profile?.uid, isWorker]);

  const handleAccept = async (req: any) => {
    try {
      await update(ref(database, `requests/${req.id}`), { status: 'accepted' });
      
      const chatId = [req.hirerUid, req.workerUid].sort().join('_');
      const chatData = {
        hirerUid: req.hirerUid,
        hirerName: req.hirerName || 'Hirer',
        workerUid: req.workerUid,
        workerName: req.workerName || 'Worker',
        lastMessage: '',
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      await set(ref(database, `chats/${chatId}`), chatData);

      setToastMsg('Request accepted! You can now chat.');
    } catch (e) {
      console.error(e);
      setToastMsg('Failed to update');
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      await update(ref(database, `requests/${reqId}`), { status: 'rejected' });
      setToastMsg('Request rejected.');
    } catch (e) {
      console.error(e);
      setToastMsg('Failed to update');
    }
  };

  const handleChat = (req: any) => {
    const otherUid = isWorker ? req.hirerUid : req.workerUid;
    const otherName = isWorker ? req.hirerName : req.workerName;
    const chatId = [profile?.uid, otherUid].sort().join('_');
    const base = isWorker ? '/worker' : '/hirer';
    navigate(`${base}/chat/${chatId}?name=${encodeURIComponent(otherName || 'User')}`);
  };

  const pendingCount = notifications.filter(n => n.status === 'pending').length;

  const getNotifIcon = (status: string) => {
    if (status === 'accepted') return <CheckCircle size={18} color="var(--color-success)" />;
    if (status === 'rejected') return <Clock size={18} color="var(--color-error)" />;
    return <Bell size={18} color={isWorker ? 'var(--color-success)' : 'var(--color-primary)'} />;
  };

  const getStatusStyle = (status: string) => {
    if (status === 'accepted') return { backgroundColor: '#ECFDF5', color: 'var(--color-success)' };
    if (status === 'rejected') return { backgroundColor: '#FEE2E2', color: 'var(--color-error)' };
    return { backgroundColor: '#FFFBEB', color: 'var(--color-warning)' };
  };

  const accentColor = isWorker ? 'var(--color-success)' : 'var(--color-primary)';

  return (
    <div className="home-container animate-fade-in">
      <Toast message={toastMsg} visible={!!toastMsg} onDismiss={() => setToastMsg(null)} type="info" />
      <header className="home-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="name-title" style={{ fontSize: '22px', margin: 0 }}>Notifications</h1>
          {pendingCount > 0 && (
            <span style={{
              backgroundColor: accentColor,
              color: 'white',
              borderRadius: '12px',
              padding: '2px 10px',
              fontSize: '12px',
              fontWeight: 800
            }}>
              {pendingCount} new
            </span>
          )}
        </div>
        <div style={{ width: 40 }} />
      </header>

      <div className="list-container" style={{ marginTop: 'var(--spacing-md)' }}>
        {loading ? (
          <div className="loading-state">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={40} color={accentColor} />
            <h3>No Notifications</h3>
            <p>New requests and chat messages will appear here.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className="feed-card" style={{
              flexDirection: 'column',
              gap: '10px',
              padding: '16px',
              borderLeft: notif.status === 'pending' ? `3px solid ${accentColor}` : '3px solid var(--color-border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    backgroundColor: notif.status === 'pending' ? `${accentColor}18` : 'var(--color-bg-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {getNotifIcon(notif.status)}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--color-text-dark)' }}>
                      {isWorker ? notif.hirerName : notif.workerName}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-text-medium)' }}>
                      <Briefcase size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                      {notif.jobTitle || notif.workerPostTitle || 'General Service'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{
                    ...getStatusStyle(notif.status),
                    padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700
                  }}>
                    {notif.status.charAt(0).toUpperCase() + notif.status.slice(1)}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-medium)' }}>
                    {formatDate(notif.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actions for pending requests */}
              {notif.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                  <button
                    onClick={() => handleReject(notif.id)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '10px',
                      border: '1px solid var(--color-error)', backgroundColor: 'transparent',
                      color: 'var(--color-error)', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAccept(notif)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '10px',
                      border: 'none', backgroundColor: accentColor,
                      color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    Accept
                  </button>
                </div>
              )}

              {/* Chat button for accepted requests */}
              {notif.status === 'accepted' && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                  <button
                    onClick={() => handleChat(notif)}
                    style={{
                      width: '100%', padding: '8px', borderRadius: '10px',
                      border: 'none', backgroundColor: accentColor,
                      color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <MessageSquare size={15} /> Open Chat
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
