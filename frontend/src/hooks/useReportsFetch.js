import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useReportsFetch = (
  isForeignProfile, 
  userId, 
  { 
    enableAccessCheck = false, 
    profileData = null, 
    isFollowing = false 
  } = {}
) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const shouldFetchReports = () => {
    if (enableAccessCheck) {
      if (!profileData) return false;
      
      if (!isForeignProfile) return true;
      
      switch (profileData.profile_visibility) {
        case 'public':
          return true;
        case 'friends_only':
          return isFollowing;
        case 'private':
        default:
          return false;
      }
    }
    return true;
  };

  const fetchReports = async () => {
    if (!shouldFetchReports()) {
      setLoading(false);
      setReports([]);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = isForeignProfile
        ? `http://192.168.0.78:8000/users/${userId}/reports`
        : 'http://192.168.0.78:8000/users/reports';

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
        throw new Error(errorData.detail || 'Ошибка загрузки отчетов');
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      setError(error.message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enableAccessCheck && !profileData) return;
    
    fetchReports();

    if (!isForeignProfile) {
      const intervalId = setInterval(fetchReports, 5000);
      return () => clearInterval(intervalId);
    }
  }, [isForeignProfile, userId, profileData, isFollowing, enableAccessCheck]);

  return { reports, loading, error, fetchReports };
};