/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { MdPerson } from 'react-icons/md';
import { t } from 'ttag';

import { showUserAreaModal } from '../actions';


const LogInButton = ({ open }) => (
  <div
    id="loginbutton"
    className="actionbuttons"
    onClick={open}
    role="button"
    title={t`User Area`}
    tabIndex={-1}
  >
    <MdPerson />
  </div>
);

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showUserAreaModal());
    },
  };
}

export default connect(null, mapDispatchToProps)(LogInButton);
