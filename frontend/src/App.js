import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import AppLayout from './components/shared/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfessorsPage from './pages/ProfessorsPage';
import MyGroupPage from './pages/MyGroupPage';
import ChatPage from './pages/ChatPage';
import StudentsPage from './pages/StudentsPage';
import GroupsAdminPage from './pages/GroupsAdminPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ProfilePage from './pages/ProfilePage';
import LoadingScreen from './components/shared/LoadingScreen';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="professors" element={<ProfessorsPage />} />
      <Route path="my-group" element={<ProtectedRoute roles={['student']}><MyGroupPage /></ProtectedRoute>} />
      <Route path="my-groups" element={<ProtectedRoute roles={['professor']}><MyGroupPage /></ProtectedRoute>} />
      <Route path="chat" element={<ChatPage />} />
      <Route path="students" element={<ProtectedRoute roles={['dean', 'professor']}><StudentsPage /></ProtectedRoute>} />
      <Route path="groups" element={<ProtectedRoute roles={['dean']}><GroupsAdminPage /></ProtectedRoute>} />
      <Route path="announcements" element={<AnnouncementsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1c1c24',
                color: '#f0f0f5',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#22d3a0', secondary: '#111' } },
              error: { iconTheme: { primary: '#f54b4b', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
