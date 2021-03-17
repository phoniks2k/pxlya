/*
 *
 * @flow
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import Captcha from './Captcha';
import { closeAlert } from '../actions';

const Alert = () => {
  const [render, setRender] = useState(false);

  const {
    alertOpen,
    alertType,
    alertTitle,
    alertMessage,
    alertBtn,
  } = useSelector((state) => state.alert);

  const dispatch = useDispatch();
  const close = useCallback(() => {
    dispatch(closeAlert());
  }, [dispatch]);

  const onTransitionEnd = () => {
    if (!alertOpen) setRender(false);
  };

  useEffect(() => {
    window.setTimeout(() => {
      if (alertOpen) setRender(true);
    }, 10);
  }, [alertOpen]);

  return (
    (render || alertOpen) && (
      <div
        className={(alertOpen && render) ? 'Overlay show' : 'Overlay'}
        onTransitionEnd={onTransitionEnd}
        role="button"
        tabIndex={-1}
        onClick={close}
        style={{
          zIndex: 5,
        }}
      >
        <div
          className="Alert"
        >
          <h2>{alertTitle}</h2>
          <p className="modaltext">
            {alertMessage}
          </p>
          <p>
            {(alertType === 'captcha')
              ? <Captcha close={close} />
              : (
                <button
                  type="button"
                  onClick={close}
                >
                  {alertBtn}
                </button>
              )}
          </p>
        </div>
      </div>
    )
  );
};

export default React.memo(Alert);
