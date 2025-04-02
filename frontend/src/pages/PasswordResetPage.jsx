import PasswordResetForm from '../components/PasswordResetForm';
import Header from '../components/Header';
import './AuthPage.css';

export default function PasswordResetPage() {
  return (
    <>
      <Header forceGuestMode />
      <div className="auth-page">
        <PasswordResetForm />
      </div>
    </>
  );
}