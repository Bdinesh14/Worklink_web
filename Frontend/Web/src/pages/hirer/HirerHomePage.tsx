import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, Users, Wrench, Zap, Droplets, Paintbrush, Hammer, MapPin, Phone, Sliders, Plus, Search, X, Bell } from 'lucide-react';
import { ref, query, onValue, push, set } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import '../home.css';

interface HirerJob { id: string; status: 'open' | 'in-progress' | 'completed'; hirerUid: string; }
interface WorkerPost {
  id: string; workerUid: string; workerName: string; workerPhoneNumber?: string;
  title: string; category: string; location: string; rate: number; rateType: 'fixed' | 'hourly';
  createdAt: string; availability: string; status: string;
}

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

const CATEGORY_COLORS: Record<string, string> = {
  Carpentry: '#0061C9', Plumbing: '#3B82F6', Electrical: '#F59E0B', Painting: '#8B5CF6',
  Cleaning: '#10B981', Welding: '#EF4444', Masonry: '#6B7280', Other: '#94A3B8',
};

const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
const AVATAR_COLORS = ['#0061C9', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6'];
const getAvatarColor = (uid: string) => AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];

export const HirerHomePage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [hirerJobs, setHirerJobs] = useState<HirerJob[]>([]);
  const [workerPosts, setWorkerPosts] = useState<WorkerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter] = useState(''); // Could come from query params
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);


  useEffect(() => {
    if (!profile?.uid) return;

    // Fetch jobs
    const unsubJobs = onValue(ref(database, 'jobs'), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, status: val.status, hirerUid: val.hirerUid }))
          .filter(j => j.hirerUid === profile.uid);
        setHirerJobs(list);
      } else {
        setHirerJobs([]);
      }
    });

    // Fetch worker posts
    const unsubPosts = onValue(query(ref(database, 'workerPosts')), (snap) => {
      if (snap.exists()) {
        const list: WorkerPost[] = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(p => p.status === 'open')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setWorkerPosts(list);
      } else {
        setWorkerPosts([]);
      }
      setLoading(false);
    });

    // Fetch sent requests
    const unsubReqs = onValue(ref(database, 'requests'), (snap) => {
      if (snap.exists()) {
        const list = Object.values(snap.val()).filter((r: any) => r.hirerUid === profile.uid);
        setSentRequests(new Set(list.map((r: any) => r.workerPostId)));
      } else {
        setSentRequests(new Set());
      }
    });

    // Track pending incoming requests (worker-to-hirer)
    const unsubNotifs = onValue(ref(database, 'requests'), (snap) => {
      if (snap.exists()) {
        const pending = Object.values(snap.val()).filter(
          (r: any) => r.hirerUid === profile.uid && r.type === 'worker-to-hirer' && r.status === 'pending'
        ).length;
        setPendingCount(pending);
      } else {
        setPendingCount(0);
      }
    });

    return () => { unsubJobs(); unsubPosts(); unsubReqs(); unsubNotifs(); };
  }, [profile?.uid]);

  const handleSendRequest = async (wp: WorkerPost) => {
    if (!profile?.uid) return;
    setSendingRequest(wp.id);
    try {
      const newReqRef = push(ref(database, 'requests'));
      await set(newReqRef, {
        id: newReqRef.key, type: 'hirer-to-worker',
        hirerUid: profile.uid, hirerName: profile.fullName,
        hirerPhoneNumber: profile.phoneNumber || '',
        workerUid: wp.workerUid, workerName: wp.workerName,
        workerPhoneNumber: wp.workerPhoneNumber || '',
        workerPostId: wp.id, workerPostTitle: wp.title,
        status: 'pending', createdAt: new Date().toISOString(),
      });
      alert(`Request sent to ${wp.workerName}`);
    } catch (e) {
      console.error(e);
      alert('Failed to send request');
    } finally {
      setSendingRequest(null);
    }
  };

  const filteredPosts = workerPosts.filter(wp => {
    const categoryMatch = !selectedCategory || wp.category === selectedCategory;
    const searchMatch = !searchQuery || [wp.workerName, wp.category, wp.title].some(field => field?.toLowerCase().includes(searchQuery.toLowerCase()));
    const locMatch = !locationFilter || wp.location?.toLowerCase().includes(locationFilter.toLowerCase());
    return categoryMatch && searchMatch && locMatch;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.fullName?.split(' ')[0] || 'there';

  return (
    <div className="home-container animate-fade-in">
      <header className="home-header">
        <div>
          <p className="greeting">{greeting},</p>
          <h1 className="name-title">{firstName} 👋</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="icon-btn"
            style={{ position: 'relative' }}
            onClick={() => navigate('/hirer/notifications')}
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
          <button className="post-job-btn bg-primary" onClick={() => navigate('/hirer/post-job')}>
            <Plus size={18} />
            <span>Post Job</span>
          </button>
        </div>
      </header>

      <div className="stats-row">
        <div className="stat-card bg-primary">
          <Briefcase size={22} color="#fff" />
          <h3 className="stat-number">{loading ? '—' : hirerJobs.length}</h3>
          <p className="stat-label">Total Posted</p>
        </div>
        <div className="stat-card bg-success">
          <Clock size={22} color="#fff" />
          <h3 className="stat-number">{loading ? '—' : hirerJobs.filter(j => j.status === 'open' || j.status === 'in-progress').length}</h3>
          <p className="stat-label">Active Jobs</p>
        </div>
        <div className="stat-card bg-purple">
          <CheckCircle size={22} color="#fff" />
          <h3 className="stat-number">{loading ? '—' : hirerJobs.filter(j => j.status === 'completed').length}</h3>
          <p className="stat-label">Completed</p>
        </div>
      </div>

      <div className="search-bar-container">
        <div className="search-inner">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search worker name, category, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <button className="filter-btn">
          <Sliders size={18} />
        </button>
      </div>

      <div className="section-header">
        <h2 className="section-title">Post by Category</h2>
      </div>
      <div className="categories-scroll">
        {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => {
          const isActive = selectedCategory === cat;
          return (
            <div
              key={cat}
              className={`category-chip ${isActive ? 'active-chip' : ''}`}
              onClick={() => setSelectedCategory(isActive ? null : cat)}
              style={isActive ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', borderWidth: '2px' } : {}}
            >
              {icon}
              <span>{cat}</span>
            </div>
          );
        })}
      </div>

      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--color-primary)" />
          <h2 className="section-title">Posted by Workers</h2>
        </div>
        {filteredPosts.length > 0 && (
          <div className="count-badge">
            {filteredPosts.length} available
          </div>
        )}
      </div>

      <div className="list-container">
        {loading ? (
          <div className="loading-state">Loading workers...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Users size={36} color="var(--color-primary)" /></div>
            <h3>No workers found</h3>
            <p>Try adjusting your search filters.</p>
          </div>
        ) : (
          filteredPosts.map(wp => {
            const alreadySent = sentRequests.has(wp.id);
            const isSending = sendingRequest === wp.id;
            const catColor = CATEGORY_COLORS[wp.category] || 'var(--color-primary)';

            return (
              <div key={wp.id} className="feed-card">
                <div className="feed-avatar" style={{ backgroundColor: getAvatarColor(wp.workerUid) }}>
                  {getInitials(wp.workerName)}
                </div>
                <div className="feed-info">
                  <div className="category-badge" style={{ backgroundColor: `${catColor}18`, color: catColor }}>
                    {wp.category}
                  </div>
                  <h3 className="feed-title">{wp.title}</h3>
                  <div className="contact-row">
                    <span className="person-name">{wp.workerName}</span>
                    {wp.workerPhoneNumber && (
                      <div className="phone-box">
                        <Phone size={10} />
                        <span>{wp.workerPhoneNumber}</span>
                      </div>
                    )}
                  </div>
                  <div className="meta-row">
                    <div className="meta-item">
                      <MapPin size={11} />
                      <span>{wp.location}</span>
                    </div>
                    <span className="rate-text">₹{wp.rate.toLocaleString('en-IN')}{wp.rateType === 'hourly' ? '/hr' : ''}</span>
                  </div>
                  <div className="card-bottom">
                    <div className="avail-box">
                      <div className="avail-dot bg-success" />
                      <span>{wp.availability || 'Available'}</span>
                    </div>
                    <button
                      className={`action-btn ${alreadySent ? 'btn-disabled' : 'bg-primary'}`}
                      onClick={() => !alreadySent && handleSendRequest(wp)}
                      disabled={alreadySent || isSending}
                    >
                      {isSending ? 'Sending...' : alreadySent ? 'Requested' : 'Send Request'}
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
