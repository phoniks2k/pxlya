/**
 *
 * @flow
 */

import React, { Suspense } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import type { State } from '../reducers';


import {
  showRegisterModal, showForgotPasswordModal, setName, setMailreg,
} from '../actions';
import LogInForm from './LogInForm';
import Tabs from './Tabs';
import UserArea from './UserArea';
import Rankings from './Rankings';

// eslint-disable-next-line max-len
const Converter = React.lazy(() => import(/* webpackChunkName: "converter" */ './Converter'));
// eslint-disable-next-line max-len
const Admintools = React.lazy(() => import(/* webpackChunkName: "admintools" */ './Admintools'));

const logoStyle = {
  marginRight: 5,
};

const LogInArea = ({ register, forgotPassword, me }) => (
  <p style={{ textAlign: 'center' }}>
    <p className="modaltext">
      {t`Login to access more features and stats.`}
    </p><br />
    <h2>{t`Login with Mail:`}</h2>
    <LogInForm me={me} />
    <p
      className="modallink"
      onClick={forgotPassword}
      role="presentation"
    >
      {t`I forgot my Password.`}</p>
    <h2>{t`or login with:`}</h2>
    <a href="./api/auth/discord">
      <img
        style={logoStyle}
        width={32}
        src={`${window.assetserver}/discordlogo.svg`}
        alt="Discord"
      />
    </a>
    <a href="./api/auth/google">
      <img
        style={logoStyle}
        width={32}
        src={`${window.assetserver}/googlelogo.svg`}
        alt="Google"
      />
    </a>
    <a href="./api/auth/facebook">
      <img
        style={logoStyle}
        width={32}
        src={`${window.assetserver}/facebooklogo.svg`}
        alt="Facebook"
      />
    </a>
    <a href="./api/auth/vk">
      <img
        style={logoStyle}
        width={32}
        src={`${window.assetserver}/vklogo.svg`}
        alt="VK"
      />
    </a>
    <a href="./api/auth/reddit">
      <img
        style={logoStyle}
        width={32}
        src={`${window.assetserver}/redditlogo.svg`}
        alt="Reddit"
      />
    </a>
    <h2>{t`or register here:`}</h2>
    <button type="button" onClick={register}>{t`Register`}</button>
  </p>
);

const UserAreaModal = ({
  name,
  register,
  forgotPassword,
  setUserName,
  setUserMailreg,
  userlvl,
}) => (
  <p style={{ textAlign: 'center' }}>
    {(name === null)
      ? (
        <LogInArea
          register={register}
          forgotPassword={forgotPassword}
        />
      )
      : (
        <Tabs>
          <div label={t`Profile`}>
            <UserArea
              setName={setUserName}
              setMailreg={setUserMailreg}
            />
          </div>
          <div label={t`Ranking`}>
            <Rankings />
          </div>
          <div label={t`Converter`}>
            <Suspense fallback={<div>Loading...</div>}>
              <Converter />
            </Suspense>
          </div>
          {userlvl && (
          <div label={(userlvl === 1) ? t`Admintools` : t`Modtools`}>
            <Suspense fallback={<div>{t`Loading...`}</div>}>
              <Admintools />
            </Suspense>
          </div>
          )}
        </Tabs>
      )}
    <p>{t`Consider joining us on Guilded:`}&nbsp;
      <a href="./guilded" target="_blank">pixelplanet.fun/guilded</a>
    </p>
  </p>
);

function mapDispatchToProps(dispatch) {
  return {
    register() {
      dispatch(showRegisterModal());
    },
    forgotPassword() {
      dispatch(showForgotPasswordModal());
    },
    setUserName(name) {
      dispatch(setName(name));
    },
    setUserMailreg(mailreg) {
      dispatch(setMailreg(mailreg));
    },
  };
}

function mapStateToProps(state: State) {
  const { name, userlvl } = state.user;
  return { name, userlvl };
}

const data = {
  content: connect(mapStateToProps, mapDispatchToProps)(UserAreaModal),
  title: t`User Area`,
};

export default data;
