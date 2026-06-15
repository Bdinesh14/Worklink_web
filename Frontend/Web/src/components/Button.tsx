import React from 'react';
import './components.css';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  icon,
  variant = 'primary',
  fullWidth = true,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseClass = `btn btn-${variant} ${fullWidth ? 'btn-full' : ''} ${className}`;

  return (
    <button className={baseClass} disabled={disabled || loading} {...props}>
      {loading ? (
        <Loader2 className="animate-spin" size={20} />
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {title || children}
        </>
      )}
    </button>
  );
};
