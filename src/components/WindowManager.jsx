/*
 * draw windows
 */

import React from 'react';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';

import Window from './Window';
import Overlay from './Overlay';
import {
  closeFullscreenWindows,
} from '../store/actions';

// eslint-disable-next-line max-len
const selectWindowIds = (state) => state.windows.windows.map((win) => win.windowId);
// eslint-disable-next-line max-len
const selectMeta = (state) => {
  console.log('check');
  return [
  state.windows.showWindows, 
  state.windows.someFullscreen,
  state.windows.windows.some((win) => win.fullscreen && win.open && !win.hidden),
]};

const WindowManager = () => {
  const windowIds = useSelector(selectWindowIds, shallowEqual);
  const [
    showWindows,
    someFullscreen,
    someOpenFullscreen,
  ] = useSelector(selectMeta, shallowEqual);
  const dispatch = useDispatch();

  if ((!showWindows && !someFullscreen) || !windowIds.length) {
    return null;
  }

  return (
    <div id="wm">
      <Overlay
        show={someOpenFullscreen}
        onClick={() => dispatch(closeFullscreenWindows())}
      />
      {windowIds.map((id) => <Window key={id} id={id} />)}
    </div>
  );
};

export default WindowManager;
