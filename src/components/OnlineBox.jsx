/**
 *
 * @flow
 */

import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { FaUser, FaPaintBrush } from 'react-icons/fa';
import { t } from 'ttag';
import { numberToString } from '../core/utils';


const OnlineBox = () => {
  const [
    online,
    totalPixels,
    name,
  ] = useSelector((state) => [
    state.ranks.online,
    state.ranks.totalPixels,
    state.user.name,
  ], shallowEqual);

  return (
    <div>
      {(online || name)
        ? (
          <div className="onlinebox">
            {(online)
              && <span title={t`User online`}>{online} <FaUser />&nbsp;</span>}
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
