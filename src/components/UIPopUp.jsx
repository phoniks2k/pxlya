/*
 * UI for single-window popUp
 */

import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { selectWindowType, selectWIndowArgs } from '../store/selectors/popup';
import {
  setWindowArgs,
  setWindowTitle,
  changeWindowType,
} from '../store/actions/popup';
import WindowContext from './context/window';
import COMPONENTS from './windows';

const UIPopUp = () => {
  const windowType = useSelector(selectWindowType);
  const args = useSelector(selectWIndowArgs);

  const [Content] = COMPONENTS[windowType];

  const dispatch = useDispatch();

  const contextData = useMemo(() => ({
    args,
    setArgs: (newArgs) => dispatch(setWindowArgs(newArgs)),
    setTitle: (title) => dispatch(setWindowTitle(title)),
    // eslint-disable-next-line max-len
    changeType: (newType, newTitel, newArgs) => dispatch(changeWindowType(newType, newTitel, newArgs)),
  }), [args]);

  return (
    <div
      className="win-content"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <WindowContext.Provider value={contextData}>
        {(windowType)
          ? <Content />
          : <h1>Loading</h1>}
      </WindowContext.Provider>
    </div>
  );
};

export default React.memo(UIPopUp);
