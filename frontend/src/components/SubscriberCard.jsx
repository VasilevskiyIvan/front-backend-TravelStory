import { Link } from 'react-router-dom';
import avatar from '/Page1_avatar.png';
import '../pages/SubscriptionsPage-style.css';

const SubscriberCard = ({ subscriber, onClose }) => {
    return (
        <Link 
            to={`/profile/${subscriber.follower_id}`}
            className="subscriber-card"
            onClick={onClose}
        >
            <div className="avatar-container">
                <img
                    src={subscriber?.avatar_url || avatar}
                    alt="Аватар"
                    className="subscriber-avatar"
                />
            </div>
            <div className="subscriber-info">
                <h3 className="username">{subscriber.username}</h3>
                <p className="subscription-date">
                    Подписался: {new Date(subscriber.created_at).toLocaleDateString('ru-RU')}
                </p>
            </div>
        </Link>
    );
};

export default SubscriberCard;