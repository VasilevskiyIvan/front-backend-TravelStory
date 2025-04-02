import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import Header from './components/Header';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import StartPage from './pages/StartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import PasswordResetCodePage from './pages/PasswordResetCodePage';
import PasswordResetPage from './pages/PasswordResetPage';

function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div>Загрузка приложения...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<PasswordResetRequestPage />} />
      <Route path="/reset-code" element={<PasswordResetCodePage />} />
      <Route path="/new-password" element={<PasswordResetPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<StartPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage isForeignProfile={true} />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:userId" element={<ReportsPage isForeignProfile={true} />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/subscriptions/:userId" element={<SubscriptionsPage isForeignProfile={true} />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}