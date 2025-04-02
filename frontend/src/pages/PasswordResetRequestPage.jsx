import PasswordResetRequestForm from '../components/PasswordResetRequestForm';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import './AuthPage.css';

export default function PasswordResetRequestPage() {
  return (
    <>
      <Header forceGuestMode />
      <div className="auth-page">
        <PasswordResetRequestForm />
        <div className="auth-links">
          <Link to="/login">Вспомнили пароль? Войти</Link>
        </div>
      </div>
    </>
  );
}