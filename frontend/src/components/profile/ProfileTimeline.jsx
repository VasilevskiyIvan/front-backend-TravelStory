import { useState, useEffect, useMemo } from 'react';
import './ProfileTimeline-style.css';

const ProfileTimeline = ({ isFollowing, isOwner }) => {
  if (!isFollowing && !isOwner) {
    return <div className="timeline" />;
  }
  const [activeMarker, setActiveMarker] = useState(null);
  const startYear = 2025;
  const endYear = 2035;
  const step = 2;

  // Генерация лет для таймлайна
  const years = useMemo(() => {
    const result = [];
    for (let year = startYear; year <= endYear; year += step) {
      result.push(year);
    }
    return result;
  }, []);

  // Данные событий
  const events = useMemo(() => [
    { date: "17.01.2031", year: 2031, link: "#" },
    { date: "19.01.2031", year: 2031, link: "#" },
    { date: "27.01.2031", year: 2031, link: "#" },
    { date: "26.03.2036", year: 2033, link: "#" },
    { date: "28.09.2034", year: 2034, link: "#" },
    { date: "29.09.2034", year: 2034, link: "#" },
    { date: "20.09.2034", year: 2034, link: "#" },
    { date: "31.10.2034", year: 2034, link: "#" },
    { date: "29.10.2034", year: 2034, link: "#" },
    { date: "26.03.2044", year: 2034, link: "#" },
    { date: "10.05.2044", year: 2034, link: "#" },
    { date: "28.09.2046", year: 2032, link: "#" }
  ], []);

  // Группировка событий
  const eventGroups = useMemo(() => {
    const groups = {};
    events.forEach(event => {
      const position = ((event.year - startYear) / (endYear - startYear)) * 100;
      const key = Math.round(position * 10) / 10;
      groups[key] = groups[key] || [];
      groups[key].push(event);
    });
    return groups;
  }, [events]);

  // Обработчик клика вне компонента
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.timeline')) {
        setActiveMarker(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Определение цвета маркера
  const getMarkerColor = (count) => {
    if (count >= 5) return '#ff0000';
    if (count === 4) return '#ff5100';
    if (count === 3) return '#ff8800';
    if (count === 2) return '#ffd900';
    return '#ffffff';
  };

  return (
    <div className="timeline" id="timeline">
      {/* Рендеринг лет */}
      {years.map(year => {
        const position = ((year - startYear) / (endYear - startYear)) * 100;
        return (
          <div 
            key={year}
            className="year"
            style={{ '--position': `${position}%` }}
          >
            {year}
          </div>
        );
      })}

      {/* Рендеринг маркеров событий */}
      {Object.entries(eventGroups).map(([position, events]) => {
        const count = events.length;
        const markerStyle = {
          '--position': `${position}%`,
          backgroundColor: getMarkerColor(count),
          cursor: count === 1 ? 'pointer' : 'default'
        };

        return (
          <div
            key={position}
            className={`marker ${activeMarker === position ? 'active' : ''}`}
            style={markerStyle}
            data-count={count}
            onClick={(e) => {
              e.stopPropagation();
              setActiveMarker(activeMarker === position ? null : position);
            }}
          >
            {count > 1 && (
              <div className="event-list">
                {events.map((event, index) => (
                  <a
                    key={index}
                    href={event.link}
                    className="event-link"
                  >
                    {event.date}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};


export default ProfileTimeline;