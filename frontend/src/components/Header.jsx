import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import avatar from '/Page1_avatar.png';
import arrowDown from '/arrow-down.svg';
import './Header-style.css';

export default function Header({ forceGuestMode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 1, label: 'Профиль', link: '/profile' },
    { id: 2, label: 'Мои отчеты', link: '/reports' },
    { id: 3, label: 'Уведомления', link: '#' },
    { id: 4, label: 'Все доступные отчеты', link: '/' },
    { id: 5, label: 'Настройки', link: '#' },
    {
      id: 6, label: 'Выход', link: '#', action: () => {
        logout();
        window.location.href = '/login';
      }
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <header>
      <div className="nav-panel">
        <div className="left-panel">Путешествия</div>
        <div className="right-panel">
          {forceGuestMode ? (
            <>
              <div className="login-name">Гость</div>
              <div className="avatar">
                <img src={avatar} alt="avatar" />
              </div>
              <div className="profile-settings-wrapper">
                <button className="profile-settings" disabled>
                  <img src={arrowDown} alt="arrow-down" />
                </button>
              </div>
            </>
          ) : user ? (
            <>
              <div className="login-name">{user.username}</div>
              <div className="avatar">
                <img src={avatar} alt="avatar" />
              </div>
              <div className="profile-settings-wrapper" ref={buttonRef}>
                <button
                  className={`profile-settings ${isMenuOpen ? 'flipped' : ''}`}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <img src={arrowDown} alt="arrow-down" />
                </button>

                {isMenuOpen && (
                  <div className="dropdown-menu" ref={menuRef}>
                    {menuItems.map((item) => (
                      <Link
                        key={item.id}
                        to={item.link}
                        className="dropdown-item"
                        onClick={() => {
                          setIsMenuOpen(false);
                          item.action?.();
                        }}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="login-button">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}