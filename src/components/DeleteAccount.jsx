/*
 * Change Password Form
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import { validatePassword, parseAPIresponse } from '../utils/validation';
import { logoutUser } from '../actions';

function validate(password) {
  const errors = [];

  const passworderror = validatePassword(password);
  if (passworderror) errors.push(passworderror);

  return errors;
}

async function submitDeleteAccount(password) {
  const body = JSON.stringify({
    password,
  });
  const response = await fetch('./api/auth/delete_account', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body,
    credentials: 'include',
  });

  return parseAPIresponse(response);
}

class DeleteAccount extends React.Component {
  constructor() {
    super();
    this.state = {
      password: '',
      submitting: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const { password, submitting } = this.state;
    if (submitting) return;

    const errors = validate(password);

    this.setState({ errors });
    if (errors.length > 0) return;
    this.setState({ submitting: true });

    const { errors: resperrors } = await submitDeleteAccount(password);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    const { logout } = this.props;
    logout();
  }

  render() {
    const { errors, password, submitting } = this.state;
    const { done } = this.props;
    return (
      <div className="inarea" style={{ backgroundColor: '#ff6666' }}>
        <form onSubmit={this.handleSubmit}>
          {errors.map((error) => (
            <p key={error} className="errormessage">Error: {error}</p>
          ))}
          <input
            value={password}
            onChange={(evt) => this.setState({ password: evt.target.value })}
            type="password"
            placeholder={t`Password`}
          />
          <br />
          <button type="submit">
            {(submitting) ? '...' : t`Yes, Delete My Account!`}
          </button>
          <button type="button" onClick={done}>{t`Cancel`}</button>
        </form>
      </div>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    async logout() {
      dispatch(logoutUser());
    },
  };
}

export default connect(null, mapDispatchToProps)(DeleteAccount);
