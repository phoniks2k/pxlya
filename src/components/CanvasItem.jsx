/**
 *
 * @flow
 */

import React from 'react';
import { t } from 'ttag';

import { THREE_CANVAS_HEIGHT } from '../core/constants';


const CanvasItem = ({
  canvasId, canvas, selCanvas, online,
}) => (
  <div
    className="cvbtn"
    onClick={() => selCanvas(canvasId)}
    role="button"
    tabIndex={0}
  >
    <img
      className="cvimg"
      alt="preview"
      src={`/preview${canvasId}.png`}
    />
    <p className="modalcvtext">
      <span className="modaltitle">{canvas.title}</span><br />
      {(online) && (
        <>
          {t`Online Users`}:&nbsp;
          <span className="modalinfo">{online}</span><br />
        </>
      )}
      <span className="modalinfo">{canvas.desc}</span><br />
      {t`Cooldown`}:&nbsp;
      <span className="modalinfo">
        {(canvas.pcd && canvas.bcd !== canvas.pcd)
          ? <span> {canvas.bcd / 1000}s / {canvas.pcd / 1000}s</span>
          : <span> {canvas.bcd / 1000}s</span>}
      </span><br />
      {t`Stacking till`}:&nbsp;
      <span className="modalinfo"> {canvas.cds / 1000}s</span><br />
      {t`Ranked`}:&nbsp;
      <span className="modalinfo">{
        (canvas.ranked) ? t`Yes` : t`No`
      }
      </span><br />
      {(canvas.req !== undefined) && (
        <>
          <span>
            {t`Requirements`}:<br />
            <span className="modalinfo">
              {(typeof canvas.req === 'number')
                ? <span>{t`User Account`} </span> : null}
              {(canvas.req > 0)
                ? <span> {t`and ${canvas.req} Pixels set`} </span>
                : null}
              {(canvas.req === 'top')
                  && <span>{t`Top 10 Daily Ranking`}</span>}
            </span>
          </span>
          <br />
        </>
      )}
      {t`Dimensions`}:&nbsp;
      <span className="modalinfo"> {canvas.size} x {canvas.size}
        {(canvas.v)
          ? <span> x {THREE_CANVAS_HEIGHT} Voxels</span>
          : <span> Pixels</span>}
      </span>
    </p>
  </div>
);

export default React.memo(CanvasItem);
