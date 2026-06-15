import React from 'react';
import { NavLink } from 'react-router-dom';
import '../pages/layout.css';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  navItems: NavItem[];
  role: 'client' | 'worker';
}

export const Sidebar: React.FC<SidebarProps> = ({ navItems, role }) => {
  const isClient = role === 'client';
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className={`sidebar-logo ${isClient ? 'bg-primary' : 'bg-success'}`}>
          <span>WL</span>
        </div>
        <span className="sidebar-brand">WorkLink</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? (isClient ? 'active-client' : 'active-worker') : ''}`
            }
          >
            <div className="nav-icon">{item.icon}</div>
            <span className="nav-label">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export const BottomNav: React.FC<SidebarProps> = ({ navItems, role }) => {
  const isClient = role === 'client';

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => 
            `bottom-nav-item ${isActive ? (isClient ? 'active-client' : 'active-worker') : ''}`
          }
        >
          <div className="nav-icon">{item.icon}</div>
          <span className="nav-label">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};
