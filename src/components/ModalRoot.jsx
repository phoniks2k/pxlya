/**
 *
 * https://stackoverflow.com/questions/35623656/how-can-i-display-a-modal-dialog-in-redux-that-performs-asynchronous-actions/35641680#35641680
 *
 * @flow
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MdClose } from 'react-icons/md';
import { t } from 'ttag';

import {
  closeWindow,
  restoreWindow,
} from '../actions';
import COMPONENTS from './windows';

const ModalRoot = () => {
  const [render, setRender] = useState(false);

  const { windowType, open, title } = useSelector(
    (state) => state.windows.modal,
  );

  const dispatch = useDispatch();

  const onTransitionEnd = () => {
    if (!open) setRender(false);
  };

  useEffect(() => {
    window.setTimeout(() => {
      if (open) setRender(true);
    }, 10);
  }, [open]);

  if (!windowType) {
    return null;
  }

  const Content = COMPONENTS[windowType || 'NONE'];

  return (
    (render || open)
      && [
        <div
          className={(open && render)
            ? 'OverlayModal show'
            : 'OverlayModal'}
          onTransitionEnd={onTransitionEnd}
          tabIndex={-1}
          onClick={() => dispatch(closeWindow(0))}
        />,
        <div
          className={(open && render) ? 'Modal show' : 'Modal'}
        >
          <h2>{title}</h2>
          <div
            onClick={() => dispatch(closeWindow(0))}
            className="ModalClose"
            role="button"
            label="close"
            title={t`Close`}
            tabIndex={-1}
          ><MdClose /></div>
          <div
            onClick={() => dispatch(restoreWindow())}
            className="ModalRestore"
            role="button"
            label="restore"
            title={t`Restore`}
            tabIndex={-1}
          >↓</div>
          <div className="Modal-content">
            <Content windowId={0} />
          </div>
        </div>,
      ]
  );
};

export default React.memo(ModalRoot);
