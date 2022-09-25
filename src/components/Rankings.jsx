/*
 * Rankings Tabs
 */

/* eslint-disable max-len */

import React, { useState, useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { t } from 'ttag';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { selectStats } from '../store/selectors/ranks';
import { colorFromText } from '../core/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController,
);

const options = {
  responsive: true,
  aspectRatio: 1.2,
  color: '#e6e6e6',
  scales: {
    x: {
      grid: {
        drawBorder: false,
        color: '#656565',
      },
      ticks: {
        color: '#e6e6e6',
      },
    },
    y: {
      grid: {
        drawBorder: false,
        color: '#656565',
      },
      ticks: {
        color: '#e6e6e6',
      },
    },
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      color: '#e6e6e6',
      text: 'Top 10 Countries [pxls / day]',
    },
  },
};

const onlineStatsOptions = {
  responsive: true,
  color: '#e6e6e6',
  scales: {
    x: {
      grid: {
        drawBorder: false,
        color: '#656565',
      },
      ticks: {
        color: '#e6e6e6',
      },
    },
    y: {
      grid: {
        drawBorder: false,
        color: '#656565',
      },
      ticks: {
        color: '#e6e6e6',
      },
    },
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      color: '#e6e6e6',
      text: 'Players Online per full hour',
    },
  },
};


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

  const cHistData = useMemo(() => {
    if (area !== 'charts') {
      return null;
    }
    const dataPerCountry = {};
    const labels = [];
    let ts = Date.now();
    let c = cHistStats.length;
    while (c) {
      const dAmount = cHistStats.length - c;
      c -= 1;
      // x label
      const date = new Date(ts);
      labels.unshift(`${date.getUTCMonth() + 1} / ${date.getUTCDate()}`);
      ts -= 1000 * 3600 * 24;
      // y data per country
      const dailyRanks = cHistStats[c];
      for (let i = 0; i < dailyRanks.length; i += 1) {
        const { cc, px } = dailyRanks[i];
        if (!dataPerCountry[cc]) {
          dataPerCountry[cc] = [];
        }
        const countryDat = dataPerCountry[cc];
        while (countryDat.length < dAmount) {
          countryDat.push(null);
        }
        countryDat.push(px);
      }
    }
    console.log(dataPerCountry);
    const countries = Object.keys(dataPerCountry);
    const datasets = countries.map((cc) => {
      const color = colorFromText(`${cc}${cc}${cc}${cc}${cc}`);
      return {
        label: cc,
        data: dataPerCountry[cc],
        borderColor: color,
        backgroundColor: color,
      };
    });
    return {
      labels,
      datasets,
    };
  }, [area, cHistStats]);

  const onlineData = useMemo(() => {
    if (area !== 'charts') {
      return null;
    }
    const labels = [];
    const data = [];
    let ts = Date.now();
    let c = onlineStats.length;
    while (c) {
      c -= 1;
      const date = new Date(ts);
      const hours = date.getHours();
      const key = hours || `${date.getMonth() + 1} / ${date.getDate()}`;
      labels.unshift(String(key));
      ts -= 1000 * 3600;
      data.push(onlineStats[c]);
    }
    return {
      labels,
      datasets: [{
        label: 'Players',
        data,
        borderColor: '#3fadda',
        backgroundColor: '#3fadda',
      }],
    };
  }, [area, onlineStats]);

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
        <span className="hdivider" />
        <span
          role="button"
          tabIndex={-1}
          className={
            (area === 'charts') ? 'modallink selected' : 'modallink'
          }
          onClick={() => setArea('charts')}
        >{t`Chart`}</span>
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
      {(area === 'charts') && (
        <>
          <Line options={options} data={cHistData} />
          <Line options={onlineStatsOptions} data={onlineData} />
        </>
      )}
      <p>
        {t`Ranking updates every 5 min. Daily rankings get reset at midnight UTC.`}
      </p>
    </>
  );
};

export default React.memo(Rankings);
