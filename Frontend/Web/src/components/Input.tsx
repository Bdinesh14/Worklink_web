import React, { useState } from 'react';
import './components.css';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  isPassword,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`input-container ${className}`}>
      <label className="input-label">{label}</label>
      <div className={`input-wrapper ${error ? 'input-error' : ''}`}>
        {leftIcon && <div className="input-left-icon">{leftIcon}</div>}
        
        <input
          className="input-field"
          type={isPassword && !showPassword ? 'password' : 'text'}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="input-right-icon pwd-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}

        {rightIcon && !isPassword && <div className="input-right-icon">{rightIcon}</div>}
      </div>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};
