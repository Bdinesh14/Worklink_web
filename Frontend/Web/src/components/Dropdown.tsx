import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './dropdown.css';

interface Option {
  label: string;
  desc?: string;
  color?: string;
}

interface DropdownProps {
  label: string;
  value: string;
  options: Option[];
  onSelect: (val: string) => void;
  placeholder: string;
  error?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onSelect, placeholder, error }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selected = options.find((o) => o.label === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <label className="input-label">{label}</label>
      <button
        type="button"
        className={`dropdown-trigger ${error ? 'input-error' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className={`dropdown-text ${!value ? 'placeholder' : ''}`}>
          {selected ? selected.label : placeholder}
        </span>
        {selected?.color && <div className="color-dot" style={{ backgroundColor: selected.color }} />}
        <ChevronDown size={18} color="var(--color-text-light)" />
      </button>
      {error && <span className="error-text">{error}</span>}

      {open && (
        <div className="dropdown-menu animate-fade-in">
          {options.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`dropdown-item ${item.label === value ? 'selected' : ''}`}
              onClick={() => {
                onSelect(item.label);
                setOpen(false);
              }}
            >
              <div style={{ flex: 1, textAlign: 'left' }}>
                <span className={`dropdown-item-label ${item.label === value ? 'active-text' : ''}`}>
                  {item.label}
                </span>
                {item.desc && <p className="dropdown-item-desc">{item.desc}</p>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.color && <div className="color-dot" style={{ backgroundColor: item.color }} />}
                {item.label === value && <Check size={16} color="var(--color-primary)" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
