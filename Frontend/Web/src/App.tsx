import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth & Onboarding
import { SplashPage } from './pages/SplashPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Layouts
import { HirerLayout } from './pages/hirer/HirerLayout';
import { WorkerLayout } from './pages/worker/WorkerLayout';

// Hirer
import { HirerHomePage } from './pages/hirer/HirerHomePage';
import { MyJobsPage } from './pages/hirer/MyJobsPage';
import { ApplicationsPage } from './pages/hirer/ApplicationsPage';
import { ChatListPage } from './pages/hirer/ChatListPage';
import { ChatPage } from './pages/hirer/ChatPage';
import { HirerProfilePage } from './pages/hirer/HirerProfilePage';
import { PostJobPage } from './pages/hirer/PostJobPage';

// Worker
import { WorkerHomePage } from './pages/worker/WorkerHomePage';
import { MyJobRequestsPage } from './pages/worker/MyJobRequestsPage';
import { WorkerApplicationsPage } from './pages/worker/WorkerApplicationsPage';
import { PostAvailabilityPage } from './pages/worker/PostAvailabilityPage';
import { WorkerProfilePage } from './pages/worker/WorkerProfilePage';
import { ChatListPage as WorkerChatListPage } from './pages/worker/ChatListPage';
import { ChatPage as WorkerChatPage } from './pages/worker/ChatPage';

// Shared
import { ManageReportsPage } from './pages/shared/ManageReportsPage';
import { NotificationsPage } from './pages/shared/NotificationsPage';


const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: 'client' | 'worker' }) => {
  const { user, role, loading } = useAuth();

  if (loading) return null; // Or a loading spinner

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    // If they have the wrong role, send them to their own home
    return <Navigate to={role === 'client' ? '/hirer/home' : '/worker/home'} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/select-role" element={<RoleSelectionPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Hirer Routes */}
      <Route path="/hirer" element={<ProtectedRoute allowedRole="client"><HirerLayout /></ProtectedRoute>}>
        <Route path="home" element={<HirerHomePage />} />
        <Route path="jobs" element={<MyJobsPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="chat" element={<ChatListPage />} />
        <Route path="chat/:id" element={<ChatPage />} />
        <Route path="profile" element={<HirerProfilePage />} />
        <Route path="post-job" element={<PostJobPage />} />
        <Route path="manage-reports" element={<ManageReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Worker Routes */}
      <Route path="/worker" element={<ProtectedRoute allowedRole="worker"><WorkerLayout /></ProtectedRoute>}>
        <Route path="home" element={<WorkerHomePage />} />
        <Route path="job-requests" element={<MyJobRequestsPage />} />
        <Route path="applications" element={<WorkerApplicationsPage />} />
        <Route path="post-availability" element={<PostAvailabilityPage />} />
        <Route path="chat" element={<WorkerChatListPage />} />
        <Route path="chat/:id" element={<WorkerChatPage />} />
        <Route path="profile" element={<WorkerProfilePage />} />
        <Route path="manage-reports" element={<ManageReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
