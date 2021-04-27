/*
 * draw windows
 * @flow
 */

import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import Window from './Window';

const selectWindowIds = (state) => state.windows.windows.map((win) => win.windowId);

const WindowsRoot = () => {
  const windowIds = useSelector(selectWindowIds, shallowEqual);

  return windowIds.map((id) => (
    <Window key={id} id={id} />
  ));
};

export default WindowsRoot;
