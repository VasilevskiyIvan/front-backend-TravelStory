import PasswordResetCodeForm from '../components/PasswordResetCodeForm';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import './AuthPage.css';

export default function PasswordResetCodePage() {
  return (
    <>
      <Header forceGuestMode />
      <div className="auth-page">
        <PasswordResetCodeForm />
        <div className="auth-links">
          <Link to="/reset-password">Отправить код повторно</Link>
        </div>
      </div>
    </>
  );
}