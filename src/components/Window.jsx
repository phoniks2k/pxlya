/*
 * draw window
 * @flow
 */

import React, { useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  moveWindow,
  resizeWindow,
  closeWindow,
  maximizeWindow,
  cloneWindow,
  focusWindow,
} from '../actions';
import useDrag from './hooks/drag';
import COMPONENTS from './windows';

const selectWindowById = (state, windowId) => state.windows.windows.find((win) => win.windowId === windowId);

const Window = ({ id }) => {
  const titleBarRef = useRef(null);
  const resizeRef = useRef(null);

  const win = useSelector((state) => selectWindowById(state, id));

  const dispatch = useDispatch();

  const focus = useCallback(() => dispatch(focusWindow(id)), []);

  useDrag(
    titleBarRef,
    focus,
    useCallback((xDiff, yDiff) => dispatch(moveWindow(id, xDiff, yDiff)), []),
  );

  useDrag(
    resizeRef,
    focus,
    useCallback((xDiff, yDiff) => dispatch(resizeWindow(id, xDiff, yDiff)), []),
  );

  const clone = (evt) => {
    evt.stopPropagation();
    dispatch(cloneWindow(id));
  };

  const maximize = (evt) => {
    evt.stopPropagation();
    dispatch(maximizeWindow(id));
  };

  const close = (evt) => {
    evt.stopPropagation();
    dispatch(closeWindow(id));
  };

  if (!win) {
    return null;
  }

  const {
    width, height,
    xPos, yPos,
    windowType,
    title,
  } = win;

  const Content = COMPONENTS[windowType];

  console.log(`render window ${id}`);

  return (
    <div
      className={`window ${windowType}`}
      onClick={focus}
      style={{
        left: xPos,
        top: yPos,
        width,
        height,
      }}
    >
      <div
        className="win-topbar"
      >
        <span
          className="win-topbtn"
          onClick={clone}
        >
          +
        </span>
        <span
          className="win-title"
          ref={titleBarRef}
        >
          {title}
        </span>
        <span
          className="win-topbtn"
          onClick={maximize}
        >
          ↑
        </span>
        <span
          className="win-topbtn"
          onClick={close}
        >
          X
        </span>
      </div>
      <div
        className="win-resize"
        ref={resizeRef}
      >
        ▨
      </div>
      <div className="win-content">
        <Content windowId={id} />
      </div>
    </div>
  );
};

export default React.memo(Window);
