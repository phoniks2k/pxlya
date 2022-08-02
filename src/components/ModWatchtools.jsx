/*
 * ModWatchtools
 * Tools to check who placed what where
 */

import React, { useState, useEffect } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { t } from 'ttag';

const keepState = {
  tlcoords: '',
  brcoords: '',
  interval: '15m',
  iid: '',
};

function parseInterval(interval) {
  if (!interval) {
    return null;
  }
  const lastChar = interval.slice(-1).toLowerCase();
  const num = parseInt(interval.slice(0, -1), 10);
  if (Number.isNaN(num) || num <= 0 || num > 600
    || !['s', 'm', 'h'].includes(lastChar)) {
    return null;
  }
  let factor = 1000;
  if (lastChar === 'm') {
    factor *= 60;
  } else if (lastChar === 'h') {
    factor *= 3600;
  }
  return Date.now() - (num * factor);
}

async function submitWatchAction(
  action,
  canvas,
  tlcoords,
  brcoords,
  interval,
  iid,
  callback,
) {
  const time = parseInterval(interval);
  if (!time) {
    callback({ info: t`Interval is invalid` });
    return;
  }
  const data = new FormData();
  data.append('watchaction', action);
  data.append('canvasid', canvas);
  data.append('ulcoor', tlcoords);
  data.append('brcoor', brcoords);
  data.append('time', time);
  data.append('iid', iid);
  try {
    const resp = await fetch('./api/modtools', {
      credentials: 'include',
      method: 'POST',
      body: data,
    });
    const ret = await resp.json();
    callback(await ret);
  } catch (err) {
    callback({
      info: `Error: ${err.message}`,
    });
  }
}

function ModWatchtools() {
  const [selectedCanvas, selectCanvas] = useState(0);
  const [tlcoords, selectTLCoords] = useState(keepState.tlcoords);
  const [brcoords, selectBRCoords] = useState(keepState.brcoords);
  const [interval, selectInterval] = useState(keepState.interval);
  const [iid, selectIid] = useState(keepState.iid);
  const [resp, setResp] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [
    canvasId,
    canvases,
  ] = useSelector((state) => [
    state.canvas.canvasId,
    state.canvas.canvases,
  ], shallowEqual);

  useEffect(() => {
    selectCanvas(canvasId);
  }, [canvasId]);

  return (
    <div style={{ textAlign: 'center', paddingLeft: '5%', paddingRight: '5%' }}>
      {resp && (
        <div style={{
          borderStyle: 'solid',
          borderColor: '#D4D4D4',
          borderWidth: 2,
          padding: 5,
          display: 'inline-block',
        }}
        >
          {resp.split('\n').map((line) => (
            <p className="modaltext">
              {line}
            </p>
          ))}
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => setResp(null)}
          >
            {t`Close`}
          </span>
        </div>
      )}
      <p className="modalcotext">{t`Check who placed in an area`}</p>
      <p className="modalcotext">{t`Canvas`}:&nbsp;
        <select
          value={selectedCanvas}
          onChange={(e) => {
            const sel = e.target;
            selectCanvas(sel.options[sel.selectedIndex].value);
          }}
        >
          {
          Object.keys(canvases).map((canvas) => ((canvases[canvas].v)
            ? null
            : (
              <option
                value={canvas}
              >
                {
              canvases[canvas].title
            }
              </option>
            )))
        }
        </select>
        {` ${t`Interval`}: `}
        <input
          value={interval}
          style={{
            display: 'inline-block',
            width: '100%',
            maxWidth: '5em',
          }}
          type="text"
          placeholder="15m"
          onChange={(evt) => {
            const newInterval = evt.target.value.trim();
            selectInterval(newInterval);
            keepState.interval = newInterval;
          }}
        />
        {` ${t`IID (optional)`}: `}
        <input
          value={iid}
          style={{
            display: 'inline-block',
            width: '100%',
            maxWidth: '10em',
          }}
          type="text"
          placeholder="xxxx-xxxxx-xxxx"
          onChange={(evt) => {
            const newIid = evt.target.value.trim();
            selectIid(newIid);
            keepState.iid = newIid;
          }}
        />
      </p>
      <p className="modalcotext">
        {t`Top-left corner`} (X_Y):&nbsp;
        <input
          value={tlcoords}
          style={{
            display: 'inline-block',
            width: '100%',
            maxWidth: '15em',
          }}
          type="text"
          placeholder="X_Y"
          onChange={(evt) => {
            const co = evt.target.value.trim();
            selectTLCoords(co);
            keepState.tlcoords = co;
          }}
        />
      </p>
      <p className="modalcotext">
        {t`Bottom-right corner`} (X_Y):&nbsp;
        <input
          value={brcoords}
          style={{
            display: 'inline-block',
            width: '100%',
            maxWidth: '15em',
          }}
          type="text"
          placeholder="X_Y"
          onChange={(evt) => {
            const co = evt.target.value.trim();
            selectBRCoords(co);
            keepState.brcoords = co;
          }}
        />
      </p>
      <button
        type="button"
        onClick={() => {
          if (submitting) {
            return;
          }
          setSubmitting(true);
          submitWatchAction(
            'all',
            selectedCanvas,
            tlcoords,
            brcoords,
            interval,
            iid,
            (ret) => {
              setSubmitting(false);
              setResp(ret.info);
            },
          );
        }}
      >
        {(submitting) ? '...' : t`Get Pixels`}
      </button>
      <button
        type="button"
        onClick={() => {
          if (submitting) {
            return;
          }
          setSubmitting(true);
          submitWatchAction(
            'summary',
            selectedCanvas,
            tlcoords,
            brcoords,
            interval,
            iid,
            (ret) => {
              setSubmitting(false);
              setResp(ret.info);
            },
          );
        }}
      >
        {(submitting) ? '...' : t`Get Users`}
      </button>
    </div>
  );
}

export default React.memo(ModWatchtools);
