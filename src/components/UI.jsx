/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';
import CoolDownBox from './CoolDownBox';
import NotifyBox from './NotifyBox';
import GlobeButton from './buttons/GlobeButton';
import PalselButton from './buttons/PalselButton';
import Palette from './Palette';
import Alert from './Alert';
import HistorySelect from './HistorySelect';
import Mobile3DControls from './Mobile3DControls';
import UserContextMenu from './UserContextMenu';
import ChannelContextMenu from './ChannelContextMenu';


const CONTEXT_MENUS = {
  USER: <UserContextMenu />,
  CHANNEL: <ChannelContextMenu />,
  /* other context menus */
};

const UI = ({
  isHistoricalView,
  is3D,
  isOnMobile,
  menuOpen,
  menuType,
}) => {
  const contextMenu = (menuOpen && menuType) ? CONTEXT_MENUS[menuType] : null;

  if (isHistoricalView) {
    return [
      <HistorySelect />,
      contextMenu,
    ];
  }
  return [
    <Alert />,
    <PalselButton />,
    <Palette />,
    (!is3D) && <GlobeButton />,
    (is3D && isOnMobile) && <Mobile3DControls />,
    <CoolDownBox />,
    <NotifyBox />,
    contextMenu,
  ];
};

function mapStateToProps(state: State) {
  const {
    isHistoricalView,
    is3D,
  } = state.canvas;
  const {
    isOnMobile,
  } = state.user;
  const {
    menuOpen,
    menuType,
  } = state.contextMenu;
  return {
    isHistoricalView,
    is3D,
    isOnMobile,
    menuOpen,
    menuType,
  };
}

export default connect(mapStateToProps)(UI);
