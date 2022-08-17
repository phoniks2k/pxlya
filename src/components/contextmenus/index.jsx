import React, { useRef } from 'react';
import ReactDOM from 'react-dom';

import UserContextMenu from './UserContextMenu';
import ChannelContextMenu from './ChannelContextMenu';
import {
  useClickOutside,
} from '../hooks/clickOutside';

export const types = {
  USER: UserContextMenu,
  CHANNEL: ChannelContextMenu,
};

const ContextMenu = ({
  type, x, y, args, close,
}) => {
  const wrapperRef = useRef(null);

  useClickOutside([wrapperRef], close);

  if (!type) {
    return null;
  }

  const Content = types[type];

  return ReactDOM.createPortal((
    <div
      ref={wrapperRef}
      className={`contextmenu ${type}`}
      style={{
        left: x,
        top: y,
      }}
    >
      <Content close={close} args={args} />
    </div>
  ), document.getElementById('app'));
};

export default React.memo(ContextMenu);
