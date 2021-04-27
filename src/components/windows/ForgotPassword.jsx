/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import { showUserAreaModal } from '../../actions';
import NewPasswordForm from '../NewPasswordForm';

const ForgotPassword = ({ login }) => (
  <p style={{ paddingLeft: '5%', paddingRight: '5%' }}>
    <p className="modaltext">
      {t`Enter your mail address and we will send you a new password:`}
    </p><br />
    <p style={{ textAlign: 'center' }}>
      <NewPasswordForm back={login} />
      <p>{t`Consider joining us on Guilded:`}&nbsp;
        <a href="./guilded" target="_blank">pixelplanet.fun/guilded</a>
      </p>
    </p>
  </p>
);

function mapDispatchToProps(dispatch) {
  return {
    login() {
      dispatch(showUserAreaModal());
    },
  };
}

export default connect(null, mapDispatchToProps)(ForgotPassword);
