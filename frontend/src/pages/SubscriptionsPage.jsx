import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SubscriberCard from '../components/SubscriberCard';
import CrossImg from '/close-cross-svgrepo-com.svg';
import './SubscriptionsPage-style.css';


const SubscriptionsPage = ({ isForeignProfile, userId, onClose }) => {
    const { user } = useAuth();
    const [subs, setSubs] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSubsData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('access_token');
                const url = isForeignProfile
                    ? `http://192.168.0.78:8000/users/${userId}/subscribers`
                    : 'http://192.168.0.78:8000/users/subscribers';

                const headers = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(url, { headers });
                
                if (!response.ok) throw new Error('Ошибка загрузки данных');
                const data = await response.json();
                setSubs(data.subscribers || []);
            } catch (error) {
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubsData();
    }, [isForeignProfile, userId]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="subscriptions-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>
                    <img src={CrossImg} alt="CloseCross" />
                </button>
                <div className="modal-content">
                    <h1>
                        Подписчики
                    </h1>
                    
                    <div className="subscribers-grid">
                        {isLoading ? (
                            <div className="loading">Загрузка...</div>
                        ) : error ? (
                            <div className="error">Ошибка: {error}</div>
                        ) : subs.length === 0 ? (
                            <div className="no-subscribers">Нет подписчиков</div>
                        ) : (
                            subs.map((sub) => (
                                <SubscriberCard 
                                    key={sub.follower_id}
                                    subscriber={sub}
                                    onClose={onClose}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionsPage;