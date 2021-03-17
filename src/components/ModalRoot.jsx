/**
 *
 * https://stackoverflow.com/questions/35623656/how-can-i-display-a-modal-dialog-in-redux-that-performs-asynchronous-actions/35641680#35641680
 *
 * @flow
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MdClose } from 'react-icons/md';
import { t } from 'ttag';

import {
  hideModal,
} from '../actions';

import HelpModal from './HelpModal';
import SettingsModal from './SettingsModal';
import UserAreaModal from './UserAreaModal';
import RegisterModal from './RegisterModal';
import CanvasSelectModal from './CanvasSelectModal';
import ArchiveModal from './ArchiveModal';
import ChatModal from './ChatModal';
import ForgotPasswordModal from './ForgotPasswordModal';


const MODAL_COMPONENTS = {
  NONE: { content: <div />, title: '' },
  HELP: HelpModal,
  SETTINGS: SettingsModal,
  USERAREA: UserAreaModal,
  REGISTER: RegisterModal,
  FORGOT_PASSWORD: ForgotPasswordModal,
  CHAT: ChatModal,
  CANVAS_SELECTION: CanvasSelectModal,
  ARCHIVE: ArchiveModal,
  /* other modals */
};

const ModalRoot = () => {
  const [render, setRender] = useState(false);

  const {
    modalType,
    modalOpen,
  } = useSelector((state) => state.modal);

  const {
    title,
    content: SpecificModal,
  } = MODAL_COMPONENTS[modalType || 'NONE'];

  const dispatch = useDispatch();
  const close = useCallback(() => {
    dispatch(hideModal());
  }, [dispatch]);

  const onTransitionEnd = () => {
    if (!modalOpen) setRender(false);
  };

  useEffect(() => {
    window.setTimeout(() => {
      if (modalOpen) setRender(true);
    }, 10);
  }, [modalOpen]);

  return (
    (render || modalOpen) && (
      <div>
        <div
          className={(modalOpen && render) ? 'Overlay show' : 'Overlay'}
          onTransitionEnd={onTransitionEnd}
          tabIndex={-1}
          onClick={close}
        />
        <div
          className={(modalOpen && render) ? 'Modal show' : 'Modal'}
        >
          <h2 style={{ paddingLeft: '5%' }}>{title}</h2>
          <div
            onClick={close}
            className="ModalClose"
            role="button"
            label="close"
            title={t`Close`}
            tabIndex={-1}
          ><MdClose /></div>
          <SpecificModal />
        </div>
      </div>
    )
  );
};

export default React.memo(ModalRoot);
