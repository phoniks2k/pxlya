/*
 * Rankings Tabs
 */

/* eslint-disable max-len */

import React, { useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { t } from 'ttag';

import { selectStats } from '../store/selectors/ranks';


const Rankings = () => {
  const [area, setArea] = useState('total');
  const [
    totalRanking,
    totalDailyRanking,
    dailyCRanking,
    prevTop,
    onlineStats,
    cHistStats,
    histStats,
  ] = useSelector(selectStats, shallowEqual);

  return (
    <>
      <div className="content">
        <span
          role="button"
          tabIndex={-1}
          className={
            (area === 'total') ? 'modallink selected' : 'modallink'
          }
          onClick={() => setArea('total')}
        >{t`Total`}</span>
        <span className="hdivider" />
        <span
          role="button"
          tabIndex={-1}
          className={
            (area === 'today') ? 'modallink selected' : 'modallink'
          }
          onClick={() => setArea('today')}
        >{t`Today`}</span>
        <span className="hdivider" />
        <span
          role="button"
          tabIndex={-1}
          className={
            (area === 'yesterday') ? 'modallink selected' : 'modallink'
          }
          onClick={() => setArea('yesterday')}
        >{t`Yesterday`}</span>
        <span className="hdivider" />
        <span
          role="button"
          tabIndex={-1}
          className={
            (area === 'countries') ? 'modallink selected' : 'modallink'
          }
          onClick={() => setArea('countries')}
        >{t`Countries Today`}</span>
      </div>
      {(['total', 'today', 'yesterday', 'countries'].includes(area)) && (
        <table style={{
          display: 'inline',
        }}
        >
          <thead>
            {{
              total: (
                <tr>
                  <th>#</th>
                  <th>{t`User`}</th>
                  <th>Pixels</th>
                  <th># Today</th>
                  <th>Pixels Today</th>
                </tr>
              ),
              today: (
                <tr>
                  <th>#</th>
                  <th>{t`User`}</th>
                  <th>Pixels</th>
                  <th># Total</th>
                  <th>Total Pixels</th>
                </tr>
              ),
              yesterday: (
                <tr>
                  <th>#</th>
                  <th>{t`User`}</th>
                  <th>Pixels</th>
                </tr>
              ),
              countries: (
                <tr>
                  <th>#</th>
                  <th>{t`Country`}</th>
                  <th>Pixels</th>
                </tr>
              ),
            }[area]}
          </thead>
          <tbody>
            {{
              total: totalRanking.map((rank) => (
                <tr key={rank.name}>
                  <td>{rank.r}</td>
                  <td><span>{rank.name}</span></td>
                  <td>{rank.t}</td>
                  <td>{rank.dr}</td>
                  <td>{rank.dt}</td>
                </tr>
              )),
              today: totalDailyRanking.map((rank) => (
                <tr key={rank.name}>
                  <td>{rank.dr}</td>
                  <td><span>{rank.name}</span></td>
                  <td>{rank.dt}</td>
                  <td>{rank.r}</td>
                  <td>{rank.t}</td>
                </tr>
              )),
              yesterday: prevTop.map((rank, ind) => (
                <tr key={rank.name}>
                  <td>{ind + 1}</td>
                  <td><span>{rank.name}</span></td>
                  <td>{rank.px}</td>
                </tr>
              )),
              countries: dailyCRanking.map((rank, ind) => (
                <tr key={rank.name}>
                  <td>{ind + 1}</td>
                  <td title={rank.cc}><img
                    style={{
                      height: '1em',
                      imageRendering: 'crisp-edges',
                    }}
                    alt={rank.cc}
                    src={`/cf/${rank.cc}.gif`}
                  /></td>
                  <td>{rank.px}</td>
                </tr>
              )),
            }[area]}
          </tbody>
        </table>
      )}
      <p>
        {t`Ranking updates every 5 min. Daily rankings get reset at midnight UTC.`}
      </p>
    </>
  );
};

export default React.memo(Rankings);
