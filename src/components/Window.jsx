/*
 * draw window
 */

import React, {
  useState, useCallback, useRef, useEffect, useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { t } from 'ttag';

import { openPopUp } from '../core/popUps';
import {
  moveWindow,
  removeWindow,
  resizeWindow,
  closeWindow,
  toggleMaximizeWindow,
  cloneWindow,
  focusWindow,
  setWindowTitle,
  setWindowArgs,
} from '../store/actions/windows';
import {
  makeSelectWindowById,
  makeSelectWindowPosById,
  makeSelectWindowArgs,
  selectShowWindows,
} from '../store/selectors/windows';
import useDrag from './hooks/drag';
import COMPONENTS from './windows';
import popUpTypes, { buildPopUpUrl } from './windows/popUpAvailable';

const Window = ({ id }) => {
  const [render, setRender] = useState(false);

  const titleBarRef = useRef();
  const resizeRef = useRef();

  const selectWindowById = useMemo(() => makeSelectWindowById(id), []);
  const selectWIndowPosById = useMemo(() => makeSelectWindowPosById(id), []);
  const selectWindowArgs = useMemo(() => makeSelectWindowArgs(id), []);
  const win = useSelector(selectWindowById);
  const position = useSelector(selectWIndowPosById);
  const showWindows = useSelector(selectShowWindows);
  const args = useSelector(selectWindowArgs);

  const dispatch = useDispatch();

  const setArgs = useCallback(
    (newArgs) => dispatch(setWindowArgs(id, newArgs),
    ), [dispatch]);
  const setTitle = useCallback(
    (title) => dispatch(setWindowTitle(id, title),
    ), [dispatch]);

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

  const {
    xPos, yPos,
    width, height,
  } = position;

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

  const { title, windowType } = win;
  const { z } = position;

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
          className="modal-topbtn close"
          role="button"
          label="close"
          key="closebtn"
          title={t`Close`}
          tabIndex={-1}
        >✕</div>
        {popUpTypes.includes(windowType) && (
          <div
            onClick={(evt) => {
              openPopUp(
                buildPopUpUrl(windowType, args),
                xPos, yPos, width, height,
              );
              close(evt);
            }}
            className="modal-topbtn pop"
            role="button"
            label="close"
            key="popbtn"
            title={t`PopUp`}
            tabIndex={-1}
          >G</div>
        )}
        {(showWindows) && (
          <div
            onClick={toggleMaximize}
            className="modal-topbtn restore"
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
          <Content args={args} setArgs={setArgs} setTitle={setTitle} />
        </div>
      </div>
    );
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
        {popUpTypes.includes(windowType) && (
          <span
            className="win-topbtn"
            key="pobtnm"
            onClick={(evt) => {
              openPopUp(
                buildPopUpUrl(windowType, args),
                xPos, yPos, width, height,
              );
              close(evt);
            }}
          >
            G
          </span>
        )}
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
        <Content args={args} setArgs={setArgs} setTitle={setTitle} />
      </div>
    </div>
  );
};

export default React.memo(Window);
