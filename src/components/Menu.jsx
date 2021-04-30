/*
 * Menu with Buttons on the top left
 *
 * @flow
 */

import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';

import HelpButton from './buttons/HelpButton';
import SettingsButton from './buttons/SettingsButton';
import LogInButton from './buttons/LogInButton';
import DownloadButton from './buttons/DownloadButton';

function Menu({
  menuOpen,
}) {
  const [render, setRender] = useState(false);

  useEffect(() => {
    window.setTimeout(() => {
      if (menuOpen) setRender(true);
    }, 10);
  }, [menuOpen]);

  const onTransitionEnd = () => {
    if (!menuOpen) setRender(false);
  };

  return (
    (render || menuOpen) && (
      <div
        className={(menuOpen && render) ? 'menu show' : 'menu'}
        onTransitionEnd={onTransitionEnd}
      >
        <SettingsButton />
        <LogInButton />
        <DownloadButton />
        <HelpButton />
      </div>
    )
  );
}

function mapStateToProps(state: State) {
  const { menuOpen } = state.gui;
  return { menuOpen };
}

export default connect(mapStateToProps)(Menu);
