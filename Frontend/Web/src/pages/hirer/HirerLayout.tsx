import React from 'react';
import { Outlet } from 'react-router-dom';
import { Home, Briefcase, FileText, MessageSquare, User } from 'lucide-react';
import { Sidebar, BottomNav } from '../../components/Sidebar';

export const HirerLayout: React.FC = () => {
  const navItems = [
    { name: 'Home', path: '/hirer/home', icon: <Home size={22} /> },
    { name: 'My Jobs', path: '/hirer/jobs', icon: <Briefcase size={22} /> },
    { name: 'Applications', path: '/hirer/applications', icon: <FileText size={22} /> },
    { name: 'Chat', path: '/hirer/chat', icon: <MessageSquare size={22} /> },
    { name: 'Profile', path: '/hirer/profile', icon: <User size={22} /> },
  ];

  return (
    <div className="app-container">
      <Sidebar navItems={navItems} role="client" />
      <main className="main-content">
        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
      <BottomNav navItems={navItems} role="client" />
    </div>
  );
};
