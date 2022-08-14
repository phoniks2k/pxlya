/*
 * draw window
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
  toggleMaximizeWindow,
  cloneWindow,
  focusWindow,
} from '../store/actions';
import useDrag from './hooks/drag';
import COMPONENTS from './windows';

// eslint-disable-next-line max-len
const selectWindowById = (state, windowId) => state.windows.windows.find((win) => win.windowId === windowId);

const Window = ({ id }) => {
  const [render, setRender] = useState(false);

  const titleBarRef = useRef(null);
  const resizeRef = useRef(null);

  const win = useSelector((state) => selectWindowById(state, id));
  const showWindows = useSelector((state) => state.windows.showWindows);

  const dispatch = useDispatch();

  const {
    open,
    hidden,
    fullscreen,
  } = win;

  const focus = useCallback(() => {
    dispatch(focusWindow(id));
  }, [dispatch]);

  const clone = useCallback((evt) => {
    evt.stopPropagation();
    dispatch(cloneWindow(id));
  }, [dispatch]);

  const toggleMaximize = useCallback(() => {
    setRender(false);
  }, [dispatch]);

  const close = useCallback((evt) => {
    evt.stopPropagation();
    dispatch(closeWindow(id));
  }, [dispatch]);

  useDrag(
    titleBarRef,
    focus,
    useCallback((xDiff, yDiff) => dispatch(
      moveWindow(id, xDiff, yDiff),
    ), [fullscreen, !render && hidden]),
  );

  useDrag(
    resizeRef,
    focus,
    useCallback((xDiff, yDiff) => dispatch(
      resizeWindow(id, xDiff, yDiff),
    ), [fullscreen, !render && hidden]),
  );

  const onTransitionEnd = useCallback(() => {
    if (hidden) {
      setRender(false);
    }
    if (!open) {
      dispatch(removeWindow(id));
      return;
    }
    if (!render && !hidden) {
      dispatch(toggleMaximizeWindow(id));
      setTimeout(() => setRender(true), 10);
    }
  }, [dispatch, hidden, open, render]);

  useEffect(() => {
    if (open && !hidden) {
      window.setTimeout(() => {
        setRender(true);
      }, 10);
    }
  }, [open, hidden]);

  if (!render && (hidden || !open)) {
    return null;
  }

  const {
    width, height,
    xPos, yPos,
    windowType,
    z,
    title,
  } = win;

  const [Content, name] = COMPONENTS[windowType];

  const windowTitle = (title) ? `${name} - ${title}` : name;
  const extraClasses = `${windowType}${
    (open && !hidden && render) ? ' show' : ''}`;

  if (fullscreen) {
    return (
      <div
        className={`modal ${extraClasses}`}
        onTransitionEnd={onTransitionEnd}
        onClick={focus}
        style={{
          zIndex: z,
        }}
      >
        <h2>{windowTitle}</h2>
        <div
          onClick={close}
          className="ModalClose"
          role="button"
          label="close"
          key="closebtn"
          title={t`Close`}
          tabIndex={-1}
        >✕</div>
        {(showWindows) && (
          <div
            onClick={toggleMaximize}
            className="ModalRestore"
            key="resbtn"
            role="button"
            label="restore"
            title={t`Restore`}
            tabIndex={-1}
          >↓</div>
        )}
        <div
          className="modal-content"
          key="content"
        >
          <Content windowId={id} />
        </div>
      </div>
    );
  }

  if (!showWindows) {
    return null;
  }

  return (
    <div
      className={`window ${extraClasses}`}
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
        key="topbar"
      >
        <span
          className="win-topbtn"
          key="clonebtn"
          onClick={clone}
          title={t`Clone`}
        >
          +
        </span>
        <span
          className="win-title"
          key="title"
          ref={titleBarRef}
          title={t`Move`}
        >
          {windowTitle}
        </span>
        <span
          className="win-topbtn"
          key="maxbtn"
          onClick={toggleMaximize}
          title={t`Maximize`}
        >
          ↑
        </span>
        <span
          className="win-topbtn close"
          key="closebtn"
          onClick={close}
          title={t`Close`}
        >
          X
        </span>
      </div>
      <div
        className="win-resize"
        key="winres"
        title={t`Resize`}
        ref={resizeRef}
      >
        ▨
      </div>
      <div
        className="win-content"
        key="content"
      >
        <Content windowId={id} />
      </div>
    </div>
  );
};

export default React.memo(Window);
