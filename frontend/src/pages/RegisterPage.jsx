import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import './RegisterPage-style.css';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        try {
            const response = await fetch('http://192.168.0.78:8000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.firstName,
                    last_name: formData.lastName
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка регистрации');
            }

            navigate('/login');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <>
            <Header forceGuestMode />
            <div className="register-container">
                <form onSubmit={handleSubmit} className="register-form">
                    <h2>регистрация</h2>
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-groups-container">
                        <div className="left-groups">
                            <div className="register-form-group">
                                <label>Желаемый логин:</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    minLength="3"
                                />
                            </div>

                            <div className="register-form-group">
                                <label>Имя (для восстановления пароля):</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="register-form-group">
                                <label>Фамилия (для восстановления пароля):</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="register-form-group">
                                <label>Email:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="right-groups">
                            <div className="register-form-group">
                                <label>Пароль:</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength="8"
                                    pattern="^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(-)|/=]).{8,}$"
                                    title="Пароль должен содержать минимум 8 символов, 1 заглавную букву, 1 цифру и 1 специальный символ"
                                />
                            </div>

                            <div className="register-form-group">
                                <label>Повторите пароль:</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="register-auth-actions">
                                <button type="submit" className="submit-register-button">Подтвердить регистрацию</button>
                                <Link to="/login" className="go-to-auth-button">Войти</Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}