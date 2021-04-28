/*
 * @flow
 */

import React from 'react';

import Help from './Help';
import Settings from './Settings';
import UserArea from './UserArea';
import Register from './Register';
import CanvasSelect from './CanvasSelect';
import Archive from './Archive';
import Chat from './Chat';
import ForgotPassword from './ForgotPassword';

export default {
  NONE: <div />,
  HELP: Help,
  SETTINGS: Settings,
  USERAREA: UserArea,
  REGISTER: Register,
  FORGOT_PASSWORD: ForgotPassword,
  CHAT: Chat,
  CANVAS_SELECTION: CanvasSelect,
  ARCHIVE: Archive,
  /* other modals */
};
