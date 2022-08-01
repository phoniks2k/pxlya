/**
 *
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { FaQuestion } from 'react-icons/fa';
import { t } from 'ttag';

import { showHelpModal } from '../../store/actions';


const HelpButton = () => {
  const dispatch = useDispatch();

  return (
    <div
      id="helpbutton"
      className="actionbuttons"
      onClick={() => dispatch(showHelpModal())}
      role="button"
      title={t`Help`}
      tabIndex={-1}
    >
      <FaQuestion />
    </div>
  );
};

export default React.memo(HelpButton);
