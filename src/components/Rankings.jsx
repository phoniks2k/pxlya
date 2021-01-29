/*
 * Rankings Tabs
 * @flow
 */

/* eslint-disable max-len */

import React from 'react';
import { t } from 'ttag';

import TotalRankings from './TotalRankings';
import DailyRankings from './DailyRankings';


class Rankings extends React.Component {
  constructor() {
    super();
    this.state = {
      orderDaily: false,
    };
  }

  render() {
    const { orderDaily } = this.state;
    return (
      <div>
        <p>
          <span
            role="button"
            tabIndex={-1}
            className={
              (!orderDaily) ? 'modallinkselected' : 'modallink'
            }
            onClick={() => {
              this.setState({ orderDaily: false });
            }}
          >{t`Total`}</span> |
          <span
            role="button"
            tabIndex={-1}
            className={
              (orderDaily) ? 'modallinkselected' : 'modallink'
            }
            onClick={() => { this.setState({ orderDaily: true }); }}
          >{t`Daily`}</span>
        </p>
        {(orderDaily) ? <DailyRankings /> : <TotalRankings />}
        <p className="modaltext">
          {t`Ranking updates every 5 min. Daily rankings get reset at midnight UTC.`}
        </p>
      </div>
    );
  }
}

export default Rankings;
