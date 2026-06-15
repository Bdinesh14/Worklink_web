import React from 'react';
import { Outlet } from 'react-router-dom';
import { Home, Briefcase, FileText, MessageSquare, User } from 'lucide-react';
import { Sidebar, BottomNav } from '../../components/Sidebar';

export const WorkerLayout: React.FC = () => {
  const navItems = [
    { name: 'Home', path: '/worker/home', icon: <Home size={22} /> },
    { name: 'Requests', path: '/worker/job-requests', icon: <Briefcase size={22} /> },
    { name: 'Applications', path: '/worker/applications', icon: <FileText size={22} /> },
    { name: 'Chat', path: '/worker/chat', icon: <MessageSquare size={22} /> },
    { name: 'Profile', path: '/worker/profile', icon: <User size={22} /> },
  ];

  return (
    <div className="app-container">
      <Sidebar navItems={navItems} role="worker" />
      <main className="main-content">
        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
      <BottomNav navItems={navItems} role="worker" />
    </div>
  );
};
