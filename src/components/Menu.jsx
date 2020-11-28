/*
 * Menu with Buttons on the top left
 *
 * @flow
 */

import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';

import HelpButton from './HelpButton';
import SettingsButton from './SettingsButton';
import LogInButton from './LogInButton';
import DownloadButton from './DownloadButton';
/*
 * removed MinecraftButton cause it didn't get used in over a year
 * also CSS rule got removed
 * and MinecraftModal from ModalRoot
 * and MinecraftTPButton from App
 * (support for it will be otherwise still kept)
 */

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
