import React from 'react';
import './ProfileSlidebar-style.css';
import avatar from '/Page1_avatar.png';
import ReportImage from '/report.svg';
import { useNavigate } from 'react-router-dom';

const truncateText = (text, maxLength) => {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
};

const ProfileSlidebar = ({
  userData,
  isOwner,
  onFollow,
  isFollowing,
  error,
  onSectionClick
}) => {
  const navigate = useNavigate();
  const handleSectionClick = (section) => {
    onSectionClick(section.toLowerCase());
  };

  const handleGoToReportsClick = () => {
    navigate(`/reports/${userData?.user_id}`);
  };

  return (
    <div className="profile-slidebar">
      <img
        src={userData?.avatar_url || avatar}
        alt="Фото профиля"
        className="profile-img"
      />

      <h2 className="profile-name">{userData?.username}</h2>
      <h2 className="profile-bio">
        {truncateText(userData?.bio || '', 90) || 'Описание профиля'}
      </h2>

      <div className="buttons-container">
        {!isOwner && userData && (
          <div className="subscription-section">
            <button
              onClick={onFollow}
              className={`follow-button ${isFollowing ? 'unfollow' : ''}`}
            >
              {isFollowing ? 'Отписаться' : 'Подписаться'}
            </button>
            {error && <div className="subscription-error">{error}</div>}
          </div>
        )}
        <button className="profile-reports-button" onClick={handleGoToReportsClick}>
          <img src={ReportImage} alt="Report" />
        </button>
      </div>

      <div className="profile-slidebar-content">
      {['ДОСТИЖЕНИЯ', 'ПОДПИСКИ', 'ПОДПИСЧИКИ'].map((title) => (
          <div 
            key={title} 
            className="card clickable-card"
            onClick={() => handleSectionClick(title)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleSectionClick(title)}
          >
            <div className="card-header">{title}</div>
            <div className="card-content">
              {Array(4).fill(null).map((_, i) => (
                <div key={i} className="circle" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSlidebar;