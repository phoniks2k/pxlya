/**
 *
 * @flow
 */

import React, { Suspense } from 'react';
import { useSelector } from 'react-redux';
import { t } from 'ttag';

import LogInArea from '../LogInArea';
import Tabs from '../Tabs';
import UserAreaContent from '../UserAreaContent';
import Rankings from '../Rankings';

// eslint-disable-next-line max-len
const Converter = React.lazy(() => import(/* webpackChunkName: "converter" */ '../Converter'));
// eslint-disable-next-line max-len
const Modtools = React.lazy(() => import(/* webpackChunkName: "modtools" */ '../Modtools'));

const UserArea = ({ windowId }) => {
  const name = useSelector((state) => state.user.name);
  const userlvl = useSelector((state) => state.user.userlvl);

  return (
    <div style={{ textAlign: 'center' }}>
      <Tabs>
        <div label={t`Profile`}>
          {(name) ? <UserAreaContent /> : <LogInArea windowId={windowId} />}
        </div>
        <div label={t`Ranking`}>
          <Rankings />
        </div>
        <div label={t`Converter`}>
          <Suspense fallback={<div>Loading...</div>}>
            <Converter />
          </Suspense>
        </div>
        {userlvl && (
        <div label={(userlvl === 1) ? t`Modtools` : t`Modtools`}>
          <Suspense fallback={<div>{t`Loading...`}</div>}>
            <Modtools />
          </Suspense>
        </div>
        )}
      </Tabs>
      <br />
      {t`Consider joining us on Guilded:`}&nbsp;
      <a href="./guilded" target="_blank">pixelplanet.fun/guilded</a>
      <br />
    </div>
  );
};

export default React.memo(UserArea);
