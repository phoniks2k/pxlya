/*
 * Rankings Tabs
 */

/* eslint-disable max-len */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { t } from 'ttag';


const Rankings = () => {
  const [orderDaily, setOrderDaily] = useState(false);
  const totalRanking = useSelector(
    (state) => state.ranks.totalRanking,
  );
  const totalDailyRanking = useSelector(
    (state) => state.ranks.totalDailyRanking,
  );

  return (
    <>
      <div className="content">
        <span
          role="button"
          tabIndex={-1}
          className={
            (!orderDaily) ? 'modallink selected' : 'modallink'
          }
          onClick={() => setOrderDaily(false)}
        >{t`Total`}</span>
        <span className="hdivider" />
        <span
          role="button"
          tabIndex={-1}
          className={
            (orderDaily) ? 'modallink selected' : 'modallink'
          }
          onClick={() => setOrderDaily(true)}
        >{t`Daily`}</span>
      </div>
      <table style={{
        display: 'inline',
      }}
      >
        <thead>
          {(orderDaily) ? (
            <tr>
              <th>#</th>
              <th>user</th>
              <th>Pixels</th>
              <th># Total</th>
              <th>Total Pixels</th>
            </tr>
          ) : (
            <tr>
              <th>#</th>
              <th>user</th>
              <th>Pixels</th>
              <th># Today</th>
              <th>Pixels Today</th>
            </tr>
          )}
        </thead>
        <tbody>
          {(orderDaily)
            ? totalDailyRanking.map((rank) => (
              <tr key={rank.name}>
                <td>{rank.dr}</td>
                <td><span>{rank.name}</span></td>
                <td>{rank.dt}</td>
                <td>{rank.r}</td>
                <td>{rank.t}</td>
              </tr>
            ))
            : totalRanking.map((rank) => (
              <tr key={rank.name}>
                <td>{rank.r}</td>
                <td><span>{rank.name}</span></td>
                <td>{rank.t}</td>
                <td>{rank.dr}</td>
                <td>{rank.dt}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <p>
        {t`Ranking updates every 5 min. Daily rankings get reset at midnight UTC.`}
      </p>
    </>
  );
};

export default React.memo(Rankings);
