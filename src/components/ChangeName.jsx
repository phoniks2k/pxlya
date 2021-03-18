/*
 * Change Name Form
 * @flow
 */

import React from 'react';
import { t } from 'ttag';
import { validateName } from '../utils/validation';
import { requestNameChange } from '../actions/fetch';


function validate(name) {
  const errors = [];

  const nameerror = validateName(name);
  if (nameerror) errors.push(nameerror);

  return errors;
}

class ChangeName extends React.Component {
  constructor() {
    super();
    this.state = {
      name: '',
      submitting: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const { name, submitting } = this.state;
    if (submitting) return;

    const errors = validate(name);

    this.setState({ errors });
    if (errors.length > 0) return;
    this.setState({ submitting: true });

    const { errors: resperrors } = await requestNameChange(name);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    const { setName, done } = this.props;
    setName(name);
    done();
  }

  render() {
    const { errors, name, submitting } = this.state;
    const { done } = this.props;
    return (
      <div className="inarea">
        <form onSubmit={this.handleSubmit}>
          {errors.map((error) => (
            <p key={error} className="errormessage">
              <span>{t`Error`}</span>:&nbsp;{error}</p>
          ))}
          <input
            value={name}
            onChange={(evt) => this.setState({ name: evt.target.value })}
            type="text"
            placeholder={t`New Username`}
          />
          <br />
          <button type="submit">
            {(submitting) ? '...' : t`Save`}
          </button>
          <button type="button" onClick={done}>{t`Cancel`}</button>
        </form>
      </div>
    );
  }
}

export default ChangeName;
