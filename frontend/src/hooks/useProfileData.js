import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useProfileData = (isForeignProfile, userId) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const url = isForeignProfile
          ? `http://192.168.0.78:8000/users/${userId}/profile`
          : 'http://192.168.0.78:8000/users/me';

        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(url, { headers });

        if (response.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          let errorMessage = errorData.detail || 'Ошибка загрузки профиля';
          
          if ([403, 404].includes(response.status)) {
            errorMessage = `${response.status}: ${errorData.detail}`;
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        setProfileData(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchProfileData();
  }, [isForeignProfile, userId, navigate]);

  return { profileData, error };
};