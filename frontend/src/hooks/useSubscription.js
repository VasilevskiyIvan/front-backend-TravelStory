import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useSubscription = (userId) => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');

  useEffect(() => {
    const checkSubscription = async () => {
      if (!userId) return;

      try {
        const response = await fetch(
          `http://192.168.0.78:8000/users/${userId}/is-following`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          }
        );

        if (response.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
          return;
        }

        const data = await response.json();
        setIsFollowing(data);
      } catch (error) {
        console.error('Ошибка проверки подписки:', error);
      }
    };

    checkSubscription();
  }, [userId, navigate]);

  const handleFollow = async () => {
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const url = `http://192.168.0.78:8000/users/follow/${userId}`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка операции');
      }

      setIsFollowing(!isFollowing);
      setSubscriptionError('');
    } catch (error) {
      setSubscriptionError(error.message);
    }
  };

  return { isFollowing, handleFollow, subscriptionError };
};