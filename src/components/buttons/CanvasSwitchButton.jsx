/**
 *
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { FaFlipboard } from 'react-icons/fa';
import { t } from 'ttag';

import { showCanvasSelectionModal } from '../../store/actions';


const CanvasSwitchButton = () => {
  const dispatch = useDispatch();

  return (
    <div
      id="canvasbutton"
      className="actionbuttons"
      onClick={() => dispatch(showCanvasSelectionModal())}
      role="button"
      title={t`Canvas Selection`}
      tabIndex={-1}
    >
      <FaFlipboard />
    </div>
  );
};

export default React.memo(CanvasSwitchButton);
