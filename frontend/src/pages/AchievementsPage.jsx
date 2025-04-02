import CrossImg from '/close-cross-svgrepo-com.svg';
import './SubscriptionsPage-style.css';

const AchievementsPage = ({ onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="subscriptions-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>
                    <img src={CrossImg} alt="CloseCross" />
                </button>
                <div className="modal-content">
                    <h1>Достижения</h1>
                    <div className="subscribers-grid">
                        <div className="info-message">Система достижений в разработке</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AchievementsPage;