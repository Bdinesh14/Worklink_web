import React, { useEffect } from 'react';
import './components.css';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'error',
  visible,
  onDismiss,
  duration = 3000,
}) => {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible || !message) return null;

  return (
    <div className={`toast-container animate-slide-up toast-${type}`}>
      <div className="toast-icon">
        {type === 'success' && <CheckCircle2 size={20} />}
        {type === 'error' && <AlertCircle size={20} />}
        {type === 'info' && <Info size={20} />}
      </div>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onDismiss}>
        <X size={16} />
      </button>
    </div>
  );
};
