import Header from '../components/Header';
import ControlPanel from '../components/ControlPanel';
import TravelCard from '../components/TravelCard';
import './Reports-page.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function parseDate(dateString) {
    const date = new Date(dateString);
    return {
        day: date.getDate(),
        month: date.toLocaleString('ru-RU', { month: 'short' })
    };
}

const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
        return text.slice(0, maxLength) + '...';
    }
    return text;
};

export default function ReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch('http://192.168.0.78:8000/report/reports_card', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    localStorage.removeItem('access_token');
                    navigate('/login');
                    return;
                }

                if (!response.ok) throw new Error('Ошибка загрузки данных');
                
                const data = await response.json();
                setReports(data.reports || []);
            } catch (error) {
                setError(error.message);
                setReports([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5000);
        return () => clearInterval(intervalId);
    }, [navigate]);

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>Ошибка: {error}</div>;

    return (
        <>
            <Header />
            <div className="page">
                <ControlPanel />
                <div className="content">
                    {Array.isArray(reports) && reports.map((item) => (
                        <TravelCard
                            key={item.id}
                            mainImage={item.main_image}
                            sideImage={item.side_image}
                            destination={item.title}
                            description={truncateText(item.description, 200)}
                            startDate={parseDate(item.start_date)}
                            endDate={parseDate(item.end_date)}
                            duration={item.duration}
                            status={item.status}
                            authorUsername={item.author_username}
                            authorId={item.user_id}
                            isOwner={item.is_owner}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}