/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaUser, FaPaintBrush } from 'react-icons/fa';
import { t } from 'ttag';
import { numberToString } from '../core/utils';


import type { State } from '../reducers';


const OnlineBox = ({ online, totalPixels, name }) => (
  <div>
    {(online || name)
      ? (
        <div className="onlinebox">
          {(online)
            && <span title={t`User online`}>{online} <FaUser />&nbsp;</span>}
          {(name != null)
              && (
              <span title={t`Pixel gesetzt`}>
                {numberToString(totalPixels)} <FaPaintBrush />
              </span>
              )}
        </div>
      ) : null}
  </div>
);

function mapStateToProps(state: State) {
  const { online, totalPixels, name } = state.user;
  return { online, totalPixels, name };
}

export default connect(mapStateToProps)(OnlineBox);
