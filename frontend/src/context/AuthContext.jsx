import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await fetch('http://192.168.0.78:8000/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser({
              username: userData.username,
              user_id: userData.user_id
            });
          } else {
            logout();
          }
        } catch (error) {
          console.error('Ошибка проверки токена:', error);
          logout();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch('http://192.168.0.78:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      });
      
      if (!response.ok) throw new Error('Ошибка авторизации');
      
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      
      const userResponse = await fetch('http://192.168.0.78:8000/auth/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });
      const userData = await userResponse.json();
      
      setUser({
        username: userData.username,
        user_id: userData.user_id
      });
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);