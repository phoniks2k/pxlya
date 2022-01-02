/*
 * Rankings Tabs
 * @flow
 */

import React from 'react';
import { useSelector } from 'react-redux';

const TotalRankings = () => {
  const totalRanking = useSelector((state) => state.ranks.totalRanking);

  return (
    <div style={{ overflowY: 'auto', display: 'inline-block' }}>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>user</th>
            <th>Pixels</th>
            <th># Today</th>
            <th>Pixels Today</th>
          </tr>
        </thead>
        <tbody>
          {
          totalRanking.map((rank) => (
            <tr>
              <td>{rank.ranking}</td>
              <td>{rank.name}</td>
              <td>{rank.totalPixels}</td>
              <td>{rank.dailyRanking}</td>
              <td>{rank.dailyTotalPixels}</td>
            </tr>
          ))
        }
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(TotalRankings);
