/**
 */

import React from 'react';
import ToggleButton from 'react-toggle-button';
import { MdCheck, MdClose } from 'react-icons/md';


const MdToggleButton = ({ value, onToggle }) => (
  <ToggleButton
    inactiveLabel={<MdClose />}
    activeLabel={<MdCheck />}
    value={value}
    onToggle={onToggle}
  />
);

// thumbAnimateRange={[-10, 36]}
export default MdToggleButton;
