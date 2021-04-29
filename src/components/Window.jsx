/*
 * draw window
 * @flow
 */

import React, { useCallback, useRef, useEffect } from 'react';
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
  const titleBarRef = useRef(null);

  const win = useSelector((state) => selectWindowById(state, id));

  const dispatch = useDispatch();

  const startMove = useCallback((event) => {
    try {
      event.stopPropagation();
      dispatch(focusWindow(id));
      console.log('startMove');

      let {
        clientX: startX,
        clientY: startY,
      } = event.touches ? event.touches[0] : evt;
      const move = (evt) => {
        evt.stopPropagation();
        try {
          const {
            clientX: curX,
            clientY: curY,
          } = evt.touches ? evt.touches[0] : evt;
          console.log(`move by ${curX-startX} - ${curY - startY}`);
          dispatch(moveWindow(id, curX - startX, curY - startY));
          startX = curX;
          startY = curY;
        } catch (e) {
          console.log(e);
        }
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('touchmove', move);
      const stopMove = (evt) => {
        evt.stopPropagation();
        console.log('stopMove');
        document.removeEventListener('mousemove', move);
        document.removeEventListener('touchmove', move);
        document.removeEventListener('mouseup', stopMove);
        document.removeEventListener('touchcancel', stopMove);
        document.removeEventListener('touchend', stopMove);
      };
      document.addEventListener('mouseup', stopMove);
      document.addEventListener('touchcancel', stopMove);
      document.addEventListener('touchend', stopMove);
    } catch (e) {
      console.log(e);
    }
  }, []);

  const startResize = useCallback((event) => {
    dispatch(focusWindow(id));

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
      document.removeEventListener('touchend', stopResize);
    };
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchcancel', stopResize);
    document.addEventListener('touchend', stopResize);
  }, []);

  useEffect(() => {
    if (titleBarRef && titleBarRef.current) {
      console.log('add listener')
      console.log(titleBarRef.current);
      titleBarRef.current.addEventListener('mousedown', startMove, {passive: false});
      titleBarRef.current.addEventListener('touchstart', startMove, {passive: false});
    }
    return () => {
      titleBarRef.current.removeEventListener('mousedown', startMove);
      titleBarRef.current.removeEventListener('touchstart', startMove);
    };
  }, [titleBarRef, startMove]);

  const clone = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    dispatch(cloneWindow(id));
  };

  const maximize = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    dispatch(maximizeWindow(id));
  };

  const close = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
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
      onClick={() => dispatch(focusWindow(id))}
      style={{
        left: xPos,
        top: yPos,
        width,
        height,
      }}
    >
      <div
        className="win-topbar"
        ref={titleBarRef}
      >
        <span
          className="win-topbtn"
          onMouseDown={clone}
        >
          +
        </span>
        <span
          className="win-title"
        >
          {title}
        </span>
        <span
          className="win-topbtn"
          onMouseDown={maximize}
        >
          ↑
        </span>
        <span
          className="win-topbtn"
          onMouseDown={close}
        >
          X
        </span>
      </div>
      <div
        onMouseDown={startResize}
        onTouchStart={startResize}
        className="win-resize"
        touchAction="none"
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
