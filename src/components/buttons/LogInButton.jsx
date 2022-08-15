/**
 *
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { MdPerson } from 'react-icons/md';
import { t } from 'ttag';

import { showUserAreaModal } from '../../store/actions/windows';


const LogInButton = () => {
  const dispatch = useDispatch();

  return (
    <div
      id="loginbutton"
      className="actionbuttons"
      onClick={() => dispatch(showUserAreaModal())}
      role="button"
      title={t`User Area`}
      tabIndex={-1}
    >
      <MdPerson />
    </div>
  );
};

export default React.memo(LogInButton);
