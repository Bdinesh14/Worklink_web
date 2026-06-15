import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import '../chat.css';

const AVATAR_COLORS = ['#0061C9', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6'];
const getAvatarColor = (uid: string) => AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

export const ChatListPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    
    // We infer chats from accepted requests
    const unsub = onValue(ref(database, 'requests'), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(r => (r.hirerUid === profile.uid || r.workerUid === profile.uid) && r.status === 'accepted');
        
        // Group by the other person
        const chatMap = new Map();
        list.forEach(req => {
          const isHirer = profile.role === 'client';
          const otherUid = isHirer ? req.workerUid : req.hirerUid;
          const otherName = isHirer ? req.workerName : req.hirerName;
          const chatId = [profile.uid, otherUid].sort().join('_'); // Unique chat ID between two users
          
          if (!chatMap.has(chatId)) {
            chatMap.set(chatId, {
              chatId,
              otherUid,
              otherName,
              jobTitle: req.jobTitle || req.workerPostTitle,
              updatedAt: req.createdAt
            });
          }
        });
        
        setChats(Array.from(chatMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      } else {
        setChats([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [profile?.uid, profile?.role]);

  return (
    <div className="home-container animate-fade-in">
      <header className="home-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} color="var(--color-text-medium)" />
        </button>
        <h2 className="section-title">Messages</h2>
        <div style={{ width: 40 }} />
      </header>
      
      <div className="chat-list-container">
        {loading ? (
          <div className="loading-state">Loading messages...</div>
        ) : chats.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={40} color="var(--color-primary)" />
            <h3>No Messages</h3>
            <p>Accept a request to start chatting.</p>
          </div>
        ) : (
          chats.map(chat => (
            <div 
              key={chat.chatId} 
              className="chat-list-item"
              onClick={() => navigate(`/${profile?.role === 'client' ? 'hirer' : 'worker'}/chat/${chat.chatId}?name=${encodeURIComponent(chat.otherName)}`)}
            >
              <div className="chat-avatar" style={{ backgroundColor: getAvatarColor(chat.otherUid) }}>
                {getInitials(chat.otherName)}
              </div>
              <div className="chat-info">
                <div className="chat-header-row">
                  <span className="chat-name">{chat.otherName}</span>
                </div>
                <span className="chat-last-msg">RE: {chat.jobTitle}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
