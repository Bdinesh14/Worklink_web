import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Send, Trash2 } from 'lucide-react';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import '../chat.css';

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  // const navigate = useNavigate();
  const { profile } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const otherName = queryParams.get('name') || 'Chat';

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Listen to messages at /messages/{chatId} (aligned with mobile schema)
  useEffect(() => {
    if (!id) return;
    const messagesRef = ref(database, `messages/${id}`);
    const unsub = onValue(messagesRef, (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val()).map(([key, val]: any) => ({ id: key, ...val }));
        list.sort((a, b) => a.id.localeCompare(b.id));
        setMessages(list);
      } else {
        setMessages([]);
      }
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !id || !profile?.uid) return;

    const msgText = inputText.trim();
    setInputText('');

    try {
      const messagesRef = ref(database, `messages/${id}`);
      const newMsgRef = push(messagesRef);
      const timestamp = new Date().toISOString();
      await set(newMsgRef, {
        type: 'text',
        text: msgText,
        senderUid: profile.uid,
        senderName: profile.fullName,
        createdAt: timestamp,
      });

      const otherUid = id.split('_').find(uid => uid !== profile.uid) || '';
      const isHirer = profile.role === 'client';
      
      const chatRef = ref(database, `chats/${id}`);
      await update(chatRef, {
        lastMessage: msgText,
        lastMessageAt: timestamp,
        hirerUid: isHirer ? profile.uid : otherUid,
        workerUid: isHirer ? otherUid : profile.uid,
        hirerName: isHirer ? profile.fullName : otherName,
        workerName: isHirer ? otherName : profile.fullName,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!id) return;
    setDeletingId(msgId);
    try {
      await remove(ref(database, `messages/${id}/${msgId}`));
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="chat-page-container animate-slide-up">
      <header className="home-header">
        <h2 className="section-title">{otherName}</h2>
        <div style={{ width: 40 }} />
      </header>

      <div className="chat-messages-area">
        {messages.length === 0 ? (
          <div className="empty-state" style={{ margin: 'auto' }}>
            <p>Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = (msg.senderUid || msg.senderId) === profile?.uid;
            return (
              <div key={msg.id} className={`message-row ${isMe ? 'message-row-sent' : 'message-row-received'}`}>
                {isMe && (
                  <button
                    className="msg-delete-btn"
                    onClick={() => handleDeleteMessage(msg.id)}
                    disabled={deletingId === msg.id}
                    title="Delete message"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <div className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}>
                  <span>{msg.text}</span>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
          <form style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }} onSubmit={handleSend}>
            <input
              type="text"
              className="chat-input"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="send-btn" disabled={!inputText.trim()}>
              <Send size={20} />
            </button>
          </form>
      </div>
    </div>
  );
};
