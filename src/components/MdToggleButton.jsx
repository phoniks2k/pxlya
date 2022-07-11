/**
 */

import React from 'react';
import ToggleButton from 'react-toggle';

const MdToggleButton = ({ value, onToggle, deactivated }) => (
  <ToggleButton
    checked={value}
    onChange={onToggle}
    disabled={deactivated}
  />
);

export default MdToggleButton;
