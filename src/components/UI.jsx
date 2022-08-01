/**
 *
 */

import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import CoolDownBox from './CoolDownBox';
import NotifyBox from './NotifyBox';
import GlobeButton from './buttons/GlobeButton';
import PalselButton from './buttons/PalselButton';
import Palette from './Palette';
import Alert from './Alert';
import HistorySelect from './HistorySelect';
import Mobile3DControls from './Mobile3DControls';
import UserContextMenu from './contextmenus/UserContextMenu';
import ChannelContextMenu from './contextmenus/ChannelContextMenu';


const CONTEXT_MENUS = {
  USER: <UserContextMenu />,
  CHANNEL: <ChannelContextMenu />,
  /* other context menus */
};

const UI = () => {
  const [
    isHistoricalView,
    is3D,
    isOnMobile,
    menuOpen,
    menuType,
  ] = useSelector((state) => [
    state.canvas.isHistoricalView,
    state.canvas.is3D,
    state.user.isOnMobile,
    state.contextMenu.menuOpen,
    state.contextMenu.menuType,
  ], shallowEqual);

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

export default React.memo(UI);
