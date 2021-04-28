/*
 * draw window
 * @flow
 */

import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  moveWindow,
  resizeWindow,
  closeWindow,
  maximizeWindow,
  cloneWindow,
  focusWindow,
} from '../actions';
import COMPONENTS from './windows';

const selectWindowById = (state, windowId) => state.windows.windows.find((win) => win.windowId === windowId);

const Window = ({ id }) => {
  const win = useSelector((state) => selectWindowById(state, id));

  const dispatch = useDispatch();

  const startMove = useCallback((event) => {
    event.preventDefault();
    let {
      clientX: startX,
      clientY: startY,
    } = event;
    const move = (evt) => {
      const {
        clientX: curX,
        clientY: curY,
      } = evt;
      dispatch(moveWindow(id, curX - startX, curY - startY));
      startX = curX;
      startY = curY;
    };
    document.addEventListener('mousemove', move);
    const stopMove = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', stopMove);
      document.removeEventListener('touchcancel', stopMove);
    };
    document.addEventListener('mouseup', stopMove);
    document.addEventListener('touchcancel', stopMove);
  }, []);

  const startResize = useCallback((event) => {
    event.preventDefault();
    let {
      clientX: startX,
      clientY: startY,
    } = event;
    const resize = (evt) => {
      const {
        clientX: curX,
        clientY: curY,
      } = evt;
      dispatch(resizeWindow(id, curX - startX, curY - startY));
      startX = curX;
      startY = curY;
    };
    document.addEventListener('mousemove', resize);
    const stopResize = () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      document.removeEventListener('touchcancel', stopResize);
    };
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchcancel', stopResize);
  }, []);

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
      onMouseDown={() => dispatch(focusWindow(id))}
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
          onMouseDown={() => dispatch(cloneWindow(id))}
        >
          +
        </span>
        <span
          className="win-title"
          onMouseDown={startMove}
        >
          {title}
        </span>
        <span
          className="win-topbtn"
          onMouseDown={() => dispatch(maximizeWindow(id))}
        >
          ↑
        </span>
        <span
          className="win-topbtn"
          onMouseDown={() => dispatch(closeWindow(id))}
        >
          X
        </span>
      </div>
      <div className="win-content">
        <Content windowId={id} />
      </div>
      <div
        onMouseDown={startResize}
        className="win-resize"
      >
        R
      </div>
    </div>
  );
};

export default React.memo(Window);
