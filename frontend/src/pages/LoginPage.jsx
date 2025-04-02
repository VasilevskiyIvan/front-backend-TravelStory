import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { useNavigate, Link } from 'react-router-dom'
import './LoginPage-style.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError('Неверные учетные данные');
    }
  };

  return (
    <>
      <Header forceGuestMode />
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-form">
          <h2>авторизация</h2>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Логин:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-login-button">Войти</button>
          <div className="login-auth-actions">
            <Link to="/register" className="go-button">
              Регистрация
            </Link>
            <Link to="/reset-password" className="go-button">
              Забыли пароль?
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}