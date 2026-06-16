import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Trash2, Mic, Square, X } from 'lucide-react';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import '../chat.css';

// Pick the best supported MIME type for voice recording
const getSupportedMimeType = () => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
};

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const otherName = queryParams.get('name') || 'Chat';

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !id || !profile?.uid) return;

    const msgText = inputText.trim();
    setInputText('');

    try {
      const messagesRef = ref(database, `messages/${id}`);
      const newMsgRef = push(messagesRef);
      await set(newMsgRef, {
        type: 'text',
        text: msgText,
        senderUid: profile.uid,
        senderId: profile.uid,
        senderName: profile.fullName,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mType });
        stream.getTracks().forEach((track) => track.stop());

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (!id || !profile?.uid) return;
          try {
            const messagesRef = ref(database, `messages/${id}`);
            const newMsgRef = push(messagesRef);
            await set(newMsgRef, {
              type: 'voice',
              audioUrl: base64Audio,
              senderUid: profile.uid,
              senderId: profile.uid,
              senderName: profile.fullName,
              createdAt: new Date().toISOString(),
            });
          } catch (error) {
            console.error('Failed to send voice message:', error);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Could not access microphone. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      audioChunksRef.current = [];
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
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} color="var(--color-text-medium)" />
        </button>
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
                  {msg.type === 'voice' ? (
                    <audio src={msg.audioUrl} controls className="audio-player" />
                  ) : (
                    <span>{msg.text}</span>
                  )}
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
        {isRecording ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)', fontWeight: 700, fontSize: '14px' }}>
              <span className="record-pulse" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-error)' }} />
              <span>Recording...</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={cancelRecording}
                style={{
                  background: 'none', border: 'none', color: 'var(--color-text-medium)',
                  fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <X size={16} /> Cancel
              </button>
              <button
                type="button"
                onClick={stopRecording}
                style={{
                  width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--color-error)',
                  border: 'none', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
                }}
              >
                <Square size={16} />
              </button>
            </div>
          </div>
        ) : (
          <form style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }} onSubmit={handleSend}>
            <button
              type="button"
              className="mic-btn"
              onClick={startRecording}
              title="Record voice note"
            >
              <Mic size={20} />
            </button>
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
        )}
      </div>
    </div>
  );
};
