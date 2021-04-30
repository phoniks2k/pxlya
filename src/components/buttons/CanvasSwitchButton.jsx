/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaGlobe } from 'react-icons/fa';
import { t } from 'ttag';

import { showCanvasSelectionModal } from '../../actions';


const CanvasSwitchButton = ({ open }) => (
  <div
    id="canvasbutton"
    className="actionbuttons"
    onClick={open}
    role="button"
    title={t`Canvas Selection`}
    tabIndex={-1}
  >
    <FaGlobe />
  </div>
);

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showCanvasSelectionModal());
    },
  };
}

export default connect(null,
  mapDispatchToProps)(CanvasSwitchButton);
