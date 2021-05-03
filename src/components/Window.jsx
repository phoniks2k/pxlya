/*
 * draw window
 * @flow
 */

import React, {
  useState, useCallback, useRef, useEffect,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { t } from 'ttag';

import {
  moveWindow,
  removeWindow,
  resizeWindow,
  closeWindow,
  maximizeWindow,
  cloneWindow,
  focusWindow,
} from '../actions';
import useDrag from './hooks/drag';
import COMPONENTS from './windows';

// eslint-disable-next-line max-len
const selectWindowById = (state, windowId) => state.windows.windows.find((win) => win.windowId === windowId);

const Window = ({ id }) => {
  const [render, setRender] = useState(false);

  const titleBarRef = useRef(null);
  const resizeRef = useRef(null);

  const win = useSelector((state) => selectWindowById(state, id));

  const dispatch = useDispatch();

  const focus = useCallback(() => dispatch(focusWindow(id)), []);
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

  const {
    width, height,
    xPos, yPos,
    windowType,
    z,
    title,
    open,
    hidden,
  } = win;

  useDrag(
    titleBarRef,
    focus,
    useCallback((xDiff, yDiff) => dispatch(moveWindow(id, xDiff, yDiff)),
      [hidden]),
  );

  useDrag(
    resizeRef,
    focus,
    useCallback((xDiff, yDiff) => dispatch(resizeWindow(id, xDiff, yDiff)),
      [hidden]),
  );

  const onTransitionEnd = () => {
    if (hidden) {
      setRender(false);
    }
    if (!open) {
      dispatch(removeWindow(id));
    }
  };

  useEffect(() => {
    window.setTimeout(() => {
      if (open && !hidden) setRender(true);
    }, 10);
  }, [open, hidden]);

  const [Content, name] = COMPONENTS[windowType];

  if (!render && hidden) {
    return null;
  }

  return (
    <div
      className={`window ${windowType}${
        (open && !hidden && render) ? ' show' : ''
      }`}
      onTransitionEnd={onTransitionEnd}
      onClick={focus}
      style={{
        left: xPos,
        top: yPos,
        width,
        height,
        zIndex: z,
      }}
    >
      <div
        className="win-topbar"
      >
        <span
          className="win-topbtn"
          onClick={clone}
          title={t`Clone`}
        >
          +
        </span>
        <span
          className="win-title"
          ref={titleBarRef}
          title={t`Move`}
        >
          {(title) ? `${name} - ${title}` : name}
        </span>
        <span
          className="win-topbtn"
          onClick={maximize}
          title={t`Maximize`}
        >
          ↑
        </span>
        <span
          className="win-topbtn close"
          onClick={close}
          title={t`Close`}
        >
          X
        </span>
      </div>
      <div
        className="win-resize"
        title={t`Resize`}
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
