/*
 */
import React from 'react';
import { useDispatch } from 'react-redux';
import { t } from 'ttag';

import LogInForm from './LogInForm';
import { changeWindowType } from '../store/actions/windows';

const logoStyle = {
  marginRight: 5,
};

const LogInArea = ({ windowId }) => {
  const dispatch = useDispatch();

  return (
    <div style={{ textAlign: 'center' }}>
      <p className="modaltext">
        {t`Login to access more features and stats.`}
      </p><br />
      <h2>{t`Login with Name or Mail:`}</h2>
      <LogInForm />
      <p
        className="modallink"
        onClick={() => dispatch(changeWindowType(windowId, 'FORGOT_PASSWORD'))}
        role="presentation"
      >
        {t`I forgot my Password.`}</p>
      <h2>{t`or login with:`}</h2>
      <a href="./api/auth/discord">
        <img
          style={logoStyle}
          width={32}
          src={`${window.ssv.assetserver}/discordlogo.svg`}
          alt="Discord"
        />
      </a>
      <a href="./api/auth/google">
        <img
          style={logoStyle}
          width={32}
          src={`${window.ssv.assetserver}/googlelogo.svg`}
          alt="Google"
        />
      </a>
      <a href="./api/auth/facebook">
        <img
          style={logoStyle}
          width={32}
          src={`${window.ssv.assetserver}/facebooklogo.svg`}
          alt="Facebook"
        />
      </a>
      <a href="./api/auth/vk">
        <img
          style={logoStyle}
          width={32}
          src={`${window.ssv.assetserver}/vklogo.svg`}
          alt="VK"
        />
      </a>
      <a href="./api/auth/reddit">
        <img
          style={logoStyle}
          width={32}
          src={`${window.ssv.assetserver}/redditlogo.svg`}
          alt="Reddit"
        />
      </a>
      <h2>{t`or register here:`}</h2>
      <button
        type="button"
        onClick={
        () => dispatch(changeWindowType(windowId, 'REGISTER'))
      }
      >
        {t`Register`}
      </button>
    </div>
  );
};

export default React.memo(LogInArea);
