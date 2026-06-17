import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
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
    
    const unsub = onValue(ref(database, 'chats'), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(c => c.hirerUid === profile.uid || c.workerUid === profile.uid || c.id.includes(profile.uid));
        
        const isHirer = profile.role === 'client';
        const formattedChats = list.map(c => {
          let otherUid = isHirer ? c.workerUid : c.hirerUid;
          let otherName = isHirer ? c.workerName : c.hirerName;
          
          if (!otherUid) {
            otherUid = c.id.split('_').find((u: string) => u !== profile.uid) || 'unknown';
          }
          if (!otherName) {
            otherName = 'User';
          }

          return {
            chatId: c.id || c.chatId || [c.hirerUid, c.workerUid].sort().join('_'),
            otherUid,
            otherName,
            lastMessage: c.lastMessage || 'No messages yet',
            updatedAt: c.lastMessageAt || c.createdAt || new Date().toISOString()
          };
        });
        
        setChats(formattedChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
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
          <h1 className="name-title" style={{ fontSize: '22px', margin: 0 }}>Messages</h1>
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
                <span className="chat-last-msg">{chat.lastMessage}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
