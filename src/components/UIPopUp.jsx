/*
 * UI for single-window popUp
 */

import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { selectWindowType, selectWIndowArgs } from '../store/selectors/popup';
import { setWindowArgs, setWindowTitle } from '../store/actions/popup';
import COMPONENTS from './windows';

const UIPopUp = () => {
  const windowType = useSelector(selectWindowType);
  const args = useSelector(selectWIndowArgs);

  const [Content] = COMPONENTS[windowType];

  const dispatch = useDispatch();

  const setArgs = useCallback(
    (newArgs) => dispatch(setWindowArgs(newArgs),
    ), [dispatch]);
  const setTitle = useCallback(
    (title) => dispatch(setWindowTitle(title),
    ), [dispatch]);

  return (
    <div
      className="window show"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {(windowType)
        ? <Content args={args} setArgs={setArgs} setTitle={setTitle} />
        : <h1>Loading</h1>}
    </div>
  );
};

export default React.memo(UIPopUp);
