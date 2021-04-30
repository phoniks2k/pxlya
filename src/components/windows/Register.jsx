/*
 * SignUp Form to register new user by mail
 * @flow
 */

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { t } from 'ttag';
import {
  validateEMail, validateName, validatePassword,
} from '../../utils/validation';
import { requestRegistration } from '../../actions/fetch';

import { changeWindowType, loginUser } from '../../actions';


function validate(name, email, password, confirmPassword) {
  const errors = [];
  const mailerror = validateEMail(email);
  if (mailerror) errors.push(mailerror);
  const nameerror = validateName(name);
  if (nameerror) errors.push(nameerror);
  const passworderror = validatePassword(password);
  if (passworderror) errors.push(passworderror);

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }
  return errors;
}

const inputStyles = {
  display: 'inline-block',
  width: '100%',
  maxWidth: '35em',
};

const Register = ({ windowId }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState('');
  const [errors, setErrors] = useState([]);

  const dispatch = useDispatch();

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    const valErrors = validate(name, email, password, confirmPassword);
    if (valErrors.length > 0) {
      setErrors(valErrors);
      return;
    }

    setSubmitting(true);
    const { errors: respErrors, me } = await requestRegistration(
      name,
      email,
      password,
    );
    setSubmitting(false);
    if (respErrors) {
      setErrors(respErrors);
      return;
    }

    dispatch(loginUser(me));
    dispatch(changeWindowType(windowId, 'USERAREA'));
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <form
        style={{ paddingLeft: '5%', paddingRight: '5%' }}
        onSubmit={handleSubmit}
      >
        <p className="modaltext">{t`Register new account here`}</p><br />
        {errors.map((error) => (
          <p key={error} className="errormessage"><span>{t`Error`}</span>
            :&nbsp;{error}</p>
        ))}
        <input
          style={inputStyles}
          value={name}
          autoComplete="username"
          onChange={(evt) => setName(evt.target.value)}
          type="text"
          placeholder={t`Name`}
        /><br />
        <input
          style={inputStyles}
          value={email}
          autoComplete="email"
          onChange={(evt) => setEmail(evt.target.value)}
          type="text"
          placeholder={t`Email`}
        /><br />
        <input
          style={inputStyles}
          value={password}
          autoComplete="new-password"
          onChange={(evt) => setPassword(evt.target.value)}
          type="password"
          placeholder={t`Password`}
        /><br />
        <input
          style={inputStyles}
          value={confirmPassword}
          autoComplete="new-password"
          onChange={(evt) => setConfirmPassword(evt.target.value)}
          type="password"
          placeholder={t`Confirm Password`}
        /><br />
        <button type="submit">
          {(submitting) ? '...' : t`Submit`}
        </button>
        <button
          type="button"
          onClick={() => dispatch(changeWindowType(windowId, 'USERAREA'))}
        >
          {t`Cancel`}
        </button>
      </form>
    </div>
  );
};


export default React.memo(Register);
