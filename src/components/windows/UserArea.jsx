/**
 *
 */

import React, { Suspense, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { t } from 'ttag';

import {
  fetchStats,
  setWindowArgs,
} from '../../store/actions';
import useInterval from '../hooks/interval';
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
  const lastStatsFetch = useSelector((state) => state.ranks.lastFetch);
  const {
    activeTab = t`Profile`,
  } = useSelector((state) => state.windows.args[windowId] || {});
  const dispatch = useDispatch();

  const setActiveTab = useCallback((label) => {
    dispatch(setWindowArgs(windowId, {
      activeTab: label,
    }));
  }, [dispatch]);

  useInterval(() => {
    if (Date.now() - 300000 > lastStatsFetch) {
      dispatch(fetchStats());
    }
  }, 300000);

  return (
    <div style={{ textAlign: 'center' }}>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab}>
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
