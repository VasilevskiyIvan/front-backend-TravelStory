import Header from '../components/Header';
import ControlPanel from '../components/ControlPanel';
import TravelCard from '../components/TravelCard';
import './Reports-page.css';
import { useParams } from 'react-router-dom';
import { useReportsFetch } from '../hooks/useReportsFetch';

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

export default function ReportsPage({ isForeignProfile = false }) {
    const { userId } = useParams();
    const { reports, loading, error } = useReportsFetch(isForeignProfile, userId);

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>Ошибка: {error}</div>;
    
    console.log(reports)
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