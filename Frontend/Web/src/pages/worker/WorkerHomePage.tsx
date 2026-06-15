import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, Users, Wrench, Zap, Droplets, Paintbrush, Hammer, MapPin, Phone, Sliders, Send, Search, X, Bell } from 'lucide-react';
import { ref, onValue, push, set } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import '../home.css';

// Using identical logic to mobile worker home
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

const CATEGORY_COLORS: Record<string, string> = {
  Carpentry: '#10B981', Plumbing: '#3B82F6', Electrical: '#F59E0B', Painting: '#8B5CF6',
  Cleaning: '#10B981', Welding: '#EF4444', Masonry: '#6B7280', Other: '#94A3B8',
};

const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
const AVATAR_COLORS = ['#10B981', '#0061C9', '#8B5CF6', '#EF4444', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6'];
const getAvatarColor = (uid: string) => AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];

export const WorkerHomePage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [hirerJobs, setHirerJobs] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<Map<string, { id: string; status: string }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);


  useEffect(() => {
    if (!profile?.uid) return;

    const unsubJobs = onValue(ref(database, 'jobs'), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(j => j.status === 'open')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setHirerJobs(list);
      } else {
        setHirerJobs([]);
      }
      setLoading(false);
    });

    const unsubReqs = onValue(ref(database, 'requests'), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter((r: any) => r.workerUid === profile.uid);

        const sentMap = new Map<string, { id: string; status: string }>();
        list.forEach(req => {
          if (req.type === 'worker-to-hirer' && req.jobId) {
            sentMap.set(req.jobId, { id: req.id, status: req.status });
          }
        });
        setSentRequests(sentMap);
        setRequests(list);
      } else {
        setSentRequests(new Map());
        setRequests([]);
      }
    });

    return () => { unsubJobs(); unsubReqs(); };
  }, [profile?.uid]);

  // Track pending incoming requests (hirer-to-worker)
  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = onValue(ref(database, 'requests'), (snap) => {
      if (snap.exists()) {
        const pending = Object.values(snap.val()).filter(
          (r: any) => r.workerUid === profile.uid && r.type === 'hirer-to-worker' && r.status === 'pending'
        ).length;
        setPendingCount(pending);
      } else {
        setPendingCount(0);
      }
    });
    return () => unsub();
  }, [profile?.uid]);


  const handleSendRequest = async (job: any) => {
    if (!profile?.uid) return;
    setSendingRequest(job.id);
    try {
      const newReqRef = push(ref(database, 'requests'));
      await set(newReqRef, {
        id: newReqRef.key, type: 'worker-to-hirer',
        hirerUid: job.hirerUid, hirerName: job.hirerName,
        hirerPhoneNumber: job.hirerPhoneNumber || '',
        workerUid: profile.uid, workerName: profile.fullName,
        workerPhoneNumber: profile.phoneNumber || '',
        jobId: job.id, jobTitle: job.title,
        status: 'pending', createdAt: new Date().toISOString(),
      });
      alert(`Applied to "${job.title}"`);
    } catch (e) {
      console.error(e);
      alert('Failed to send request');
    } finally {
      setSendingRequest(null);
    }
  };

  const filteredJobs = hirerJobs.filter(job => {
    const categoryMatch = !selectedCategory || job.category === selectedCategory;
    const searchMatch = !searchQuery || [job.hirerName, job.category, job.title].some(field => field?.toLowerCase().includes(searchQuery.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.fullName?.split(' ')[0] || 'there';

  return (
    <div className="home-container animate-fade-in">
      <header className="home-header">
        <div>
          <p className="greeting">{greeting},</p>
          <h1 className="name-title color-success">{firstName} 👋</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="icon-btn"
            style={{ position: 'relative' }}
            onClick={() => navigate('/worker/notifications')}
          >
            <Bell size={22} color="var(--color-text-medium)" />
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                backgroundColor: 'var(--color-error)',
                borderRadius: '50%', width: '9px', height: '9px',
                border: '2px solid white',
              }} />
            )}
          </button>
          <button className="post-job-btn bg-success" onClick={() => navigate('/worker/post-availability')}>
            <Send size={16} />
            <span>Post Skills</span>
          </button>
        </div>
      </header>

      <div className="stats-row">
        <div className="stat-card bg-success">
          <Briefcase size={22} color="#fff" />
          <h3 className="stat-number">{requests.length}</h3>
          <p className="stat-label">Jobs Requested</p>
        </div>
        <div className="stat-card bg-blue">
          <Clock size={22} color="#fff" />
          <h3 className="stat-number">{requests.filter(r => r.status === 'accepted').length}</h3>
          <p className="stat-label">Active Jobs</p>
        </div>
        <div className="stat-card bg-purple">
          <CheckCircle size={22} color="#fff" />
          <h3 className="stat-number">{requests.filter(r => r.status === 'completed').length}</h3>
          <p className="stat-label">Completed</p>
        </div>
      </div>

      <div className="search-bar-container">
        <div className="search-inner">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search hirer name, category, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}><X size={16} /></button>
          )}
        </div>
        <button className="filter-btn">
          <Sliders size={18} />
        </button>
      </div>

      <div className="section-header">
        <h2 className="section-title">Categories</h2>
      </div>
      <div className="categories-scroll">
        {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => {
          const isActive = selectedCategory === cat;
          return (
            <div 
              key={cat} 
              className={`category-chip row-chip ${isActive ? 'active-chip' : ''}`}
              onClick={() => setSelectedCategory(isActive ? null : cat)}
              style={isActive ? { borderColor: 'var(--color-success)', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: '2px' } : {}}
            >
              {icon}
              <span>{cat}</span>
            </div>
          );
        })}
      </div>

      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--color-success)" />
          <h2 className="section-title">Posted by Hirers</h2>
        </div>
        {filteredJobs.length > 0 && (
          <div className="count-badge success-badge">
            {filteredJobs.length} open jobs
          </div>
        )}
      </div>

      <div className="list-container">
        {loading ? (
          <div className="loading-state">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <Briefcase size={40} color="var(--color-success)" />
            <h3>No matching jobs</h3>
            <p>Jobs posted by Hirers will appear here.</p>
          </div>
        ) : (
          filteredJobs.map(job => {
            const reqInfo = sentRequests.get(job.id);
            const alreadySent = !!reqInfo;
            const status = reqInfo?.status;
            const isSending = sendingRequest === job.id;
            const catColor = CATEGORY_COLORS[job.category] || 'var(--color-success)';

            return (
              <div key={job.id} className="feed-card">
                <div className="feed-avatar" style={{ backgroundColor: getAvatarColor(job.hirerUid) }}>
                  {getInitials(job.hirerName)}
                </div>
                <div className="feed-info">
                  <div className="category-badge" style={{ backgroundColor: `${catColor}18`, color: catColor }}>
                    {job.category}
                  </div>
                  <h3 className="feed-title">{job.title}</h3>
                  <div className="contact-row">
                    <span className="person-name">{job.hirerName}</span>
                    {job.hirerPhoneNumber && (
                      <div className="phone-box">
                        <Phone size={10} />
                        <span>{job.hirerPhoneNumber}</span>
                      </div>
                    )}
                  </div>
                  <div className="meta-row">
                    <div className="meta-item">
                      <MapPin size={11} />
                      <span>{job.location}</span>
                    </div>
                    <span className="rate-text">₹{job.budget.toLocaleString('en-IN')}{job.budgetType === 'hourly' ? '/hr' : ''}</span>
                  </div>
                  <div className="card-bottom">
                    <div className="avail-box">
                      <div className="avail-dot" style={{ backgroundColor: job.urgency === 'Emergency' || job.urgency === 'High' ? '#EF4444' : '#F59E0B' }} />
                      <span>{job.urgency} Urgency</span>
                    </div>
                    <button
                      className={`action-btn ${alreadySent ? (status === 'accepted' ? 'btn-accepted' : 'btn-disabled') : 'bg-success'}`}
                      onClick={() => !alreadySent && handleSendRequest(job)}
                      disabled={alreadySent || isSending}
                    >
                      {isSending ? 'Sending...' : alreadySent ? (status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Rejected' : 'Pending') : 'Send Request'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
