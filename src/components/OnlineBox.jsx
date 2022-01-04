/**
 *
 * @flow
 */

import React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { FaUser, FaPaintBrush, FaFlipboard } from 'react-icons/fa';
import { t } from 'ttag';

import { toggleOnlineCanvas } from '../actions';
import { numberToString } from '../core/utils';


const OnlineBox = () => {
  const [
    online,
    totalPixels,
    name,
    onlineCanvas,
    canvasId,
  ] = useSelector((state) => [
    state.ranks.online,
    state.ranks.totalPixels,
    state.user.name,
    state.gui.onlineCanvas,
    state.canvas.canvasId,
  ], shallowEqual);
  const dispatch = useDispatch();

  const onlineUsers = (onlineCanvas) ? online[canvasId] : online.total;

  return (
    <div>
      {(onlineUsers || name)
        ? (
          <div
            className="onlinebox"
            role="button"
            tabIndex="0"
            onClick={() => dispatch(toggleOnlineCanvas())}
          >
            {(onlineUsers)
              && (
              <span
                title={(onlineCanvas)
                  ? t`Online Users on Canvas`
                  : t`Total Online Users`}
              >
                {onlineUsers}
                <FaUser />
                {(onlineCanvas) && <FaFlipboard />}
                 &nbsp;
              </span>
              )}
            {(name != null)
                && (
                <span title={t`Pixels placed`}>
                  {numberToString(totalPixels)} <FaPaintBrush />
                </span>
                )}
          </div>
        ) : null}
    </div>
  );
};

export default React.memo(OnlineBox);
