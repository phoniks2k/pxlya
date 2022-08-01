/*
 * draw windows
 */

import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import Window from './Window';

// eslint-disable-next-line max-len
const selectWindowIds = (state) => state.windows.windows.map((win) => win.windowId);

const WindowManager = () => {
  const windowIds = useSelector(selectWindowIds, shallowEqual);
  const showWindows = useSelector((state) => state.windows.showWindows);

  if (!showWindows) return null;

  return (
    <div id="wm">
      {
      windowIds.map((id) => (<Window key={id} id={id} />))
    }
    </div>
  );
};

export default WindowManager;
