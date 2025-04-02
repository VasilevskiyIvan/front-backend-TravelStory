import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AuthForms.css';

export default function PasswordResetCodeForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { state } = useLocation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://192.168.0.78:8000/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state?.email, code })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка проверки кода');
      }

      navigate('/new-password', { state: { email: state?.email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Введите код подтверждения</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <label>Код из письма:</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={loading} className="password-reset-submit-button">
        {loading ? 'Проверка...' : 'Подтвердить код'}
      </button>
    </form>
  );
}