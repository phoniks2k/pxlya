/*
 *
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import GlobalCaptcha from './GlobalCaptcha';
import BanInfo from './BanInfo';
import { closeAlert } from '../store/actions';

const Alert = () => {
  const [render, setRender] = useState(false);

  const {
    open,
    alertType,
    title,
    message,
    btn,
  } = useSelector((state) => state.alert);

  const dispatch = useDispatch();
  const close = useCallback(() => {
    dispatch(closeAlert());
  }, [dispatch]);

  const onTransitionEnd = () => {
    if (!open) setRender(false);
  };

  useEffect(() => {
    window.setTimeout(() => {
      if (open) setRender(true);
    }, 10);
  }, [open]);

  let Content = null;
  switch (alertType) {
    case 'captcha':
      Content = GlobalCaptcha;
      break;
    case 'ban':
      Content = BanInfo;
      break;
    default:
      // nothing
  }

  return (
    (render || open) && (
      <div>
        <div
          className={(open && render)
            ? 'OverlayAlert show'
            : 'OverlayAlert'}
          onTransitionEnd={onTransitionEnd}
          tabIndex={-1}
          onClick={close}
        />
        <div
          className={(open && render) ? 'Alert show' : 'Alert'}
        >
          <h2>{title}</h2>
          <p className="modaltext">
            {message}
          </p>
          <div>
            {(Content) ? (
              <Content close={close} />
            ) : (
              <button
                type="button"
                onClick={close}
              >{btn}</button>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default React.memo(Alert);
