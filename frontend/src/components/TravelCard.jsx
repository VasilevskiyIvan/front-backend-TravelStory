import { useNavigate } from 'react-router-dom';
import ReportImage from '/report.svg';
import EditImage from '/edit-button-svgrepo-com.svg';
import goToProfile from '/profile-round-1342-svgrepo-com.svg';
import './TravelCard-style.css';

function DateBox({ day, month }) {
  return (
    <div className="date-box">
      <span className="info-span">{day}</span>
      {month}
    </div>
  );
}

export default function TravelCard({
  mainImage,
  sideImage,
  destination,
  description,
  startDate,
  endDate,
  duration,
  status,
  authorUsername,
  authorId,
  isOwner,
}) {
  const navigate = useNavigate();

  const getDayWord = (number) => {
    const lastTwo = number % 100;
    if (lastTwo >= 11 && lastTwo <= 14) return 'дней';

    const lastOne = number % 10;
    switch (lastOne) {
      case 1: return 'день';
      case 2:
      case 3:
      case 4: return 'дня';
      default: return 'дней';
    }
  };

  const handleGoToProfileClick = () => {
    navigate(`/profile/${authorId}`);
  };

  const handleGoToReportsClick = () => {
    navigate(`/reports/${authorId}`);
  };

  return (
    <div className="travel-card">
      <div className="user-header">
        <button className="to-profile-button" onClick={handleGoToProfileClick}>
          <img src={goToProfile} alt="go-to-profile-img"/>
        </button>
        <button className="to-reports-button" onClick={handleGoToReportsClick}>
          <img src={ReportImage} alt="Report" />
        </button>
        <div className="travel-username">{authorUsername}</div>
      </div>

      <div className="travel-header">
        <img src={mainImage} alt="Main Travel" />
        <div className="side-info">
          <button className="report-button">
            <img src={ReportImage} alt="Report" />
          </button>
          <img src={sideImage} alt="Side Travel" />
        </div>
      </div>

      <div className="travel-content-body">
        <div className="travel-content">
          <div className="travel-content-name">{destination}</div>
          <div className="travel-content-description">{description}</div>
        </div>

        <div className="travel-info">
          <div className="travel-content-info">инфо</div>

          <div className="date-container">
            <DateBox day={startDate.day} month={startDate.month} />
            <DateBox day={endDate.day} month={endDate.month} />
          </div>

          <div className="duration-box">
            <span className="info-span">{duration}</span>
            {getDayWord(duration)}
          </div>

          <div className="button-container">
            <button
              className={`edit-button ${!isOwner ? 'disabled' : ''}`}
              disabled={!isOwner}
            >
              <img src={EditImage} alt="Edit" />
            </button>
            <button className="report-button-2">
              <img src={ReportImage} alt="Report" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}