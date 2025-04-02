import React from 'react';
import TravelCard from '../TravelCard';
import { parseDate, truncateText } from '../../utils/helpers';
import './LatestReports-style.css';

const LatestReports = ({ reports }) => {
  if (reports.length === 0) {
    return <div className="reports-content" />;
  }

  return (
    <div className="reports-content">
      {reports.length > 0 ? (
        [...reports]
          .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
          .slice(0, 2)
          .map((item) => (
            <div key={item.id} className="reports-content-items">
              <TravelCard
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
            </div>
          ))
      ) : (
        <div className="no-reports">Доступные к просмотру отчеты отсутствуют</div>
      )}
    </div>
  );
};

export default LatestReports;