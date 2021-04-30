/*
 * Rankings Tabs
 * @flow
 */

/* eslint-disable max-len */

import React, { useState } from 'react';
import { t } from 'ttag';

import TotalRankings from './TotalRankings';
import DailyRankings from './DailyRankings';


const Rankings = () => {
  const [orderDaily, setOrderDaily] = useState(false);

  return (
    <div>
      <div>
        <span
          role="button"
          tabIndex={-1}
          className={
            (!orderDaily) ? 'modallinkselected' : 'modallink'
          }
          onClick={() => setOrderDaily(false)}
        >{t`Total`}</span> |
        <span
          role="button"
          tabIndex={-1}
          className={
            (orderDaily) ? 'modallinkselected' : 'modallink'
          }
          onClick={() => setOrderDaily(true)}
        >{t`Daily`}</span>
      </div>
      {(orderDaily) ? <DailyRankings /> : <TotalRankings />}
      <p className="modaltext">
        {t`Ranking updates every 5 min. Daily rankings get reset at midnight UTC.`}
      </p>
    </div>
  );
};

export default React.memo(Rankings);
