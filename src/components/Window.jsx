/*
 * draw window
 * @flow
 */

import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import Chat from './Chat';
import {
  moveWindow,
} from '../actions';

const selectWindowById = (state, windowId) => state.windows.windows.find((win) => win.windowId === windowId);

const WINDOW_COMPONENTS = {
  NONE: <div />,
  CHAT: Chat,
};

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
    };
    document.addEventListener('mouseup', stopMove, { once: true });
    document.addEventListener('mouseleave', stopMove, { once: true });
  }, []);

  const {
    width, height,
    xPos, yPos,
    windowType,
    title,
  } = win;

  const Content = WINDOW_COMPONENTS[windowType];

  console.log(`render window ${id}`);

  return (
    <div
      className="window"
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
          className="win-topbtnn"
        >
          +
        </span>
        <span
          className="win-title"
          onMouseDown={startMove}
        >
          Move Here
        </span>
        <span
          className="win-topbtnn"
        >
          ↑
        </span>
        <span
          className="win-topbtnn"
        >
          X
        </span>
      </div>
      <Content windowId={id} />
    </div>
  );
};

export default React.memo(Window);
