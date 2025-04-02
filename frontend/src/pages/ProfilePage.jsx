import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { useProfileData } from '../hooks/useProfileData';
import { useReportsFetch } from '../hooks/useReportsFetch';
import Header from '../components/Header';
import ProfileSlidebar from '../components/profile/ProfileSlidebar';
import ProfileMap from '../components/profile/ProfileMap';
import ProfileTimeline from '../components/profile/ProfileTimeline';
import StatsTable from '../components/profile/StatsTable';
import LatestReports from '../components/profile/LatestReports';
import ErrorCard from '../components/ErrorCard';
import SubscriptionsPage from './SubscriptionsPage';
import './ProfilePage-style.css';
import AchievementsPage from './AchievementsPage';
import FollowingsPage from './FollowingsPage';

const useStats = (reports) => {
  const [statsData, setStatsData] = useState([]);

  useEffect(() => {
    if (reports.length === 0) {
      setStatsData([
        { category: 'Отчетов', allTime: 0, lastYear: 0 },
        { category: 'Время в поездке', allTime: 0, lastYear: 0 },
        { category: 'Ср. время поездки', allTime: 0, lastYear: 0 },
        { category: 'Пройдено', allTime: 0, lastYear: 0 },
        { category: 'Посещено стран', allTime: 0, lastYear: 0 },
        { category: 'Посещено городов', allTime: 0, lastYear: 0 },
      ]);
    } else {
      setStatsData([
        { category: 'Отчетов', allTime: reports.length, lastYear: 17 },
        { category: 'Время в поездке', allTime: 13, lastYear: 153 },
        { category: 'Ср. время поездки', allTime: 6.5, lastYear: 9 },
        { category: 'Пройдено', allTime: 310, lastYear: 2096 },
        { category: 'Посещено стран', allTime: 2, lastYear: 14 },
        { category: 'Посещено городов', allTime: 3, lastYear: 29 },
      ]);
    }
  }, [reports.length]);

  return statsData;
};

export default function ProfilePage({ isForeignProfile = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();

  useEffect(() => {
    if (isForeignProfile && user?.user_id === userId) {
      navigate('/profile', { replace: true });
    }
  }, [isForeignProfile, user, userId, navigate]);
  const { profileData, error: profileError } = useProfileData(isForeignProfile, userId);
  const { isFollowing, handleFollow, subscriptionError } = useSubscription(userId);

  const { reports, loading, error: reportsError } = useReportsFetch(
    isForeignProfile,
    userId,
    {
      enableAccessCheck: true,
      profileData,
      isFollowing
    }
  );

  const statsData = useStats(reports);
  const [activeModal, setActiveModal] = useState(null);

  const error = profileError || reportsError;

  const handleOpenModal = (section) => {
    setActiveModal(section);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  if (error) return <ErrorCard statusCode={error.startsWith('403') ? 403 : 404} message={error.split(': ')[1] || error} />;
  if (loading) return <div className="loading">Загрузка...</div>;
  if (!profileData) return <ErrorCard statusCode={404} message="Профиль не найден" />;

  console.log(profileData)
  console.log(reports)
  console.log(statsData)
  const hasFullAccess = () => {
    if (!profileData) return false;

    if (profileData.profile_visibility === 'private') {
      return !isForeignProfile;
    }
    if (profileData.profile_visibility === 'friends_only') {
      return isFollowing || !isForeignProfile;
    }
    return true;
  };

  return (
    <>
      <Header />
      <div className="profile-page">
        <div className="container-fluid">
          <div className="main-content">
            <ProfileSlidebar
              isOwner={!isForeignProfile}
              userData={profileData}
              isFollowing={isFollowing}
              onFollow={handleFollow}
              error={subscriptionError}
              onSectionClick={handleOpenModal}
            />
            {hasFullAccess() && (
              <div className="main-content-right">
                <ProfileMap
                  locations={profileData.travel_stats?.locations || []}
                  isFollowing={isFollowing}
                  isOwner={!isForeignProfile}
                />
                <StatsTable
                  statsData={statsData}
                  visibility={profileData.profile_visibility}
                  isFollowing={isFollowing}
                  isOwner={!isForeignProfile}
                />
              </div>
            )}
          </div>
        </div>
        {hasFullAccess() && (
          <div className="profile-page-bottom">
            <div className="timeline-container">
              <div className="timeline-title">
                <h3>Таймлайн</h3>
                <div className="timeline-line-after-h3"></div>
              </div>
              <ProfileTimeline
                isFollowing={isFollowing}
                isOwner={!isForeignProfile}
              />
            </div>
            <div className="reports-section">
              <div className="reports-section-title">
                <h3>Последние отчеты</h3>
                <div className="reports-line-after-h3"></div>
              </div>
              <LatestReports
                reports={reports}
                isFollowing={isFollowing}
                isOwner={!isForeignProfile}
              />
            </div>
          </div>
        )}
      </div>

      {activeModal === 'подписчики' && (
        <SubscriptionsPage
          isForeignProfile={isForeignProfile}
          userId={profileData.user_id}
          onClose={handleCloseModal}
        />
      )}

      {activeModal === 'подписки' && (
        <FollowingsPage
          isForeignProfile={isForeignProfile}
          userId={profileData.user_id}
          onClose={handleCloseModal}
        />
      )}

      {activeModal === 'достижения' && (
        <AchievementsPage
          userId={profileData.user_id}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}