/*
 * Menu to change user credentials
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import type { State } from '../reducers';

import UserMessages from './UserMessages';
import ChangePassword from './ChangePassword';
import ChangeName from './ChangeName';
import ChangeMail from './ChangeMail';
import DeleteAccount from './DeleteAccount';
import SocialSettings from './SocialSettings';
import { logoutUser } from '../actions';

import { numberToString } from '../core/utils';

const Stat = ({ text, value, rank }) => (
  <p>
    <span className="stattext">{(rank) ? `${text}: #` : `${text}: `}</span>
    &nbsp;
    <span className="statvalue">{numberToString(value)}</span>
  </p>
);

class UserArea extends React.Component {
  constructor() {
    super();
    this.state = {
      // that should be an ENUM tbh
      changeNameExtended: false,
      changeMailExtended: false,
      changePasswdExtended: false,
      deleteAccountExtended: false,
    };
  }

  render() {
    const {
      stats, name, logout, mailreg, setMailreg, setName,
    } = this.props;
    const {
      changeNameExtended,
      changeMailExtended,
      changePasswdExtended,
      deleteAccountExtended,
      socialSettingsExtended,
    } = this.state;
    return (
      <p style={{ textAlign: 'center' }}>
        <UserMessages />
        <Stat
          text={t`Todays Placed Pixels`}
          value={stats.dailyTotalPixels}
        />
        <Stat
          text={t`Daily Rank`}
          value={stats.dailyRanking}
          rank
        />
        <Stat
          text={t`Placed Pixels`}
          value={stats.totalPixels}
        />
        <Stat
          text={t`Total Rank`}
          value={stats.ranking}
          rank
        />
        <p className="modaltext">
          <p>{t`Your name is: ${name}`}</p>(
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={logout}
          > {t`Log out`}</span> |
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => this.setState({
              changeNameExtended: true,
              changeMailExtended: false,
              changePasswdExtended: false,
              deleteAccountExtended: false,
              socialSettingsExtended: false,
            })}
          > {t`Change Username`}</span> |
          {(mailreg)
            && (
            <span>
              <span
                role="button"
                tabIndex={-1}
                className="modallink"
                onClick={() => this.setState({
                  changeNameExtended: false,
                  changeMailExtended: true,
                  changePasswdExtended: false,
                  deleteAccountExtended: false,
                  socialSettingsExtended: false,
                })}
              > {t`Change Mail`}</span> |
            </span>
            )}
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => this.setState({
              changeNameExtended: false,
              changeMailExtended: false,
              changePasswdExtended: true,
              deleteAccountExtended: false,
              socialSettingsExtended: false,
            })}
          > {t`Change Password`}</span> |
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => this.setState({
              changeNameExtended: false,
              changeMailExtended: false,
              changePasswdExtended: false,
              deleteAccountExtended: true,
              socialSettingsExtended: false,
            })}
          > {t`Delete Account`}</span> )
          <br />(
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => this.setState({
              changeNameExtended: false,
              changeMailExtended: false,
              changePasswdExtended: false,
              deleteAccountExtended: false,
              socialSettingsExtended: true,
            })}
          > {t`Social Settings`}</span> )
        </p>
        <p className="modaltext" />
        {(changePasswdExtended)
          && (
          <ChangePassword
            mailreg={mailreg}
            done={() => {
              setMailreg(true);
              this.setState({ changePasswdExtended: false });
            }}
            cancel={() => { this.setState({ changePasswdExtended: false }); }}
          />
          )}
        {(changeNameExtended)
          && (
          <ChangeName
            setName={setName}
            done={() => { this.setState({ changeNameExtended: false }); }}
          />
          )}
        {(changeMailExtended)
          && (
          <ChangeMail
            done={() => { this.setState({ changeMailExtended: false }); }}
          />
          )}
        {(deleteAccountExtended)
          && (
          <DeleteAccount
            done={() => { this.setState({ deleteAccountExtended: false }); }}
          />
          )}
        {(socialSettingsExtended)
          && (
          <SocialSettings
            done={() => { this.setState({ socialSettingsExtended: false }); }}
          />
          )}
        {(typeof window.hcaptcha !== 'undefined')
          && (
            <img
              role="presentation"
              src="hcaptcha.svg"
              alt="hCaptcha"
              title="test hCaptcha"
              onClick={() => {
                window.pixel = null;
                window.hcaptcha.execute();
              }}
              style={{
                width: '5%',
                height: '5%',
                paddingTop: 20,
                cursor: 'pointer',
              }}
            />
          )}
      </p>
    );
  }
}


function mapStateToProps(state: State) {
  const {
    name,
    mailreg,
    totalPixels,
    dailyTotalPixels,
    ranking,
    dailyRanking,
  } = state.user;
  const stats = {
    totalPixels,
    dailyTotalPixels,
    ranking,
    dailyRanking,
  };

  return { name, mailreg, stats };
}

function mapDispatchToProps(dispatch) {
  return {
    async logout() {
      const response = await fetch(
        './api/auth/logout',
        { credentials: 'include' },
      );
      if (response.ok) {
        dispatch(logoutUser());
      }
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserArea);
