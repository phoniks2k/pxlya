/**
 *
 * @flow
 */

import React from 'react';
import { t } from 'ttag';

import Chat from './Chat';


const ChatModal = () => (
  <div style={{
    position: 'fixed',
    top: 80,
    padding: 10,
    bottom: 10,
    left: 10,
    right: 10,
  }}
  >
    <div
      className="inarea"
      style={{
        height: '95%',
      }}
    >
      <Chat />
    </div>
  </div>
);

const data = {
  content: ChatModal,
  title: t`Chat`,
};

export default data;
