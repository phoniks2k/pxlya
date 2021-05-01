/**
 *
 * @flow
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { FaCog } from 'react-icons/fa';
import { t } from 'ttag';

import { showSettingsModal } from '../../actions';


const SettingsButton = () => {
  const dispatch = useDispatch();

  return (
    <div
      id="settingsbutton"
      className="actionbuttons"
      onClick={() => dispatch(showSettingsModal())}
      role="button"
      title={t`Settings`}
      tabIndex={-1}
    >
      <FaCog />
    </div>
  );
};

export default React.memo(SettingsButton);
