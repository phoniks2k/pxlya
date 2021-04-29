/*
 * LogIn Form
 * @flow
 */
import React from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import {
  validateEMail, validateName, validatePassword,
} from '../utils/validation';
import { requestLogin } from '../actions/fetch';
import { loginUser } from '../actions';


function validate(nameoremail, password) {
  const errors = [];
  const mailerror = (nameoremail.indexOf('@') !== -1)
    ? validateEMail(nameoremail)
    : validateName(nameoremail);
  if (mailerror) errors.push(mailerror);
  const passworderror = validatePassword(password);
  if (passworderror) errors.push(passworderror);

  return errors;
}

const inputStyles = {
  display: 'inline-block',
  width: '75%',
  maxWidth: '35em',
};

class LogInForm extends React.Component {
  constructor() {
    super();
    this.state = {
      nameoremail: '',
      password: '',
      submitting: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const { nameoremail, password, submitting } = this.state;
    const { login } = this.props;
    if (submitting) return;

    const errors = validate(nameoremail, password);

    this.setState({ errors });
    if (errors.length > 0) return;

    this.setState({ submitting: true });
    const { errors: resperrors, me } = await requestLogin(
      nameoremail,
      password,
    );
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    login(me);
  }

  render() {
    const {
      errors, nameoremail, password, submitting,
    } = this.state;
    return (
      <form onSubmit={this.handleSubmit}>
        {errors.map((error) => (
          <p key={error}><span>{t`Error`}</span>:&nbsp;{error}</p>
        ))}
        <input
          value={nameoremail}
          style={inputStyles}
          onChange={(evt) => this.setState({ nameoremail: evt.target.value })}
          type="text"
          placeholder={t`Name or Email`}
        /><br />
        <input
          value={password}
          style={inputStyles}
          onChange={(evt) => this.setState({ password: evt.target.value })}
          type="password"
          placeholder={t`Password`}
        />
        <p>
          <button type="submit">
            {(submitting) ? '...' : t`LogIn`}
          </button>
        </p>
      </form>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    login(me) {
      dispatch(loginUser(me));
    },
  };
}

export default connect(null, mapDispatchToProps)(LogInForm);
