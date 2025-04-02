import React from 'react';
import './StatsTable-style.css';

const StatsTable = ({ statsData, visibility, isFollowing, isOwner }) => {
  const shouldRender = () => {
    if (visibility === 'private') return isOwner;
    if (visibility === 'friends_only') return isFollowing || isOwner;
    return true;
  };

  if (!shouldRender()) return null;

  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th className="title-stats">Статистика</th>
          <th className="stats-columns-title">все время</th>
          <th className="stats-columns-title">последний год</th>
        </tr>
      </thead>
      <tbody>
        {statsData.map((row, index) => (
          <tr key={index}>
            <td>{row.category}</td>
            <td>{row.allTime}</td>
            <td>{row.lastYear}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default StatsTable;