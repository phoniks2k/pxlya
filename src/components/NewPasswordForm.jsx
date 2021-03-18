/*
 * Form for requesting password-reset mail
 * @flow
 */
import React from 'react';
import { t } from 'ttag';
import { validateEMail } from '../utils/validation';
import { requestNewPassword } from '../actions/fetch';

function validate(email) {
  const errors = [];
  const mailerror = validateEMail(email);
  if (mailerror) errors.push(mailerror);
  return errors;
}

const inputStyles = {
  display: 'inline-block',
  width: '100%',
  maxWidth: '35em',
};

class NewPasswordForm extends React.Component {
  constructor() {
    super();
    this.state = {
      email: '',
      submitting: false,
      success: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const { email, submitting } = this.state;
    if (submitting) return;

    const errors = validate(email);

    this.setState({ errors });
    if (errors.length > 0) return;

    this.setState({ submitting: true });
    const { errors: resperrors } = await requestNewPassword(email);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    this.setState({
      success: true,
    });
  }

  render() {
    const { success } = this.state;
    const { back } = this.props;
    if (success) {
      return (
        <div>
          <p className="modalmessage">
            {t`Sent you a mail with instructions to reset your password.`}
          </p>
          <button type="button" onClick={back}>Back</button>
        </div>
      );
    }
    const { errors, email, submitting } = this.state;
    return (
      <form onSubmit={this.handleSubmit}>
        {errors.map((error) => (
          <p key={error}><span>{t`Error`}</span>:&nbsp;{error}</p>
        ))}
        <input
          style={inputStyles}
          value={email}
          onChange={(evt) => this.setState({ email: evt.target.value })}
          type="text"
          placeholder={t`Email`}
        />
        <br />
        <button type="submit">
          {(submitting) ? '...' : t`Submit`}
        </button>
        <button type="button" onClick={back}>{t`Cancel`}</button>
      </form>
    );
  }
}

export default NewPasswordForm;
