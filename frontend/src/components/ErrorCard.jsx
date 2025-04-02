import { useNavigate } from 'react-router-dom';
import './ErrorCard.css';
import Header from './Header';

export default function ErrorCard({ statusCode = 500, message = 'Произошла неизвестная ошибка' }) {
    const navigate = useNavigate();

    const getTitle = () => {
        switch (statusCode) {
            case 403: return 'Доступ запрещён 🔒';
            case 404: return 'Профиль не найден 🔍';
            default: return 'Произошла ошибка ⚠️';
        }
    };

    return (
        <>
            <Header />
            <div className="error-card">
                <div className="error-content">
                    <h2>{getTitle()}</h2>
                    <p>{message}</p>
                    <div className="error-actions">
                        <button onClick={() => navigate(-1)}>Назад</button>
                        <button onClick={() => navigate('/')}>На главную</button>
                    </div>
                </div>
            </div>
        </>
    );
}