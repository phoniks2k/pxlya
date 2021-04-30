/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaCog } from 'react-icons/fa';
import { t } from 'ttag';

import { showSettingsModal } from '../../actions';


const SettingsButton = ({ open }) => (
  <div
    id="settingsbutton"
    className="actionbuttons"
    onClick={open}
    role="button"
    title={t`Settings`}
    tabIndex={-1}
  >
    <FaCog />
  </div>
);

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showSettingsModal());
    },
  };
}

export default connect(null, mapDispatchToProps)(SettingsButton);
