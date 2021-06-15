/**
 */

import React from 'react';
import ToggleButton from 'react-toggle-button';
import { MdCheck, MdClose } from 'react-icons/md';


const MdToggleButton = ({ value, onToggle, deactivated }) => (
  <ToggleButton
    inactiveLabel={<MdClose />}
    activeLabel={<MdCheck />}
    value={value}
    onToggle={onToggle}
    colors={(deactivated)
      ? {
        activeThumb: {
          base: '#b2b2b2',
        },
        inactiveTumb: {
          base: '#b2b2b2',
        },
        active: {
          base: '#cbcbcb',
        },
        inactive: {
          base: '#cbcbcb',
        },
      }
      : {}}
    thumbStyleHover={{ backgroundColor: '#ededed' }}
  />
);

// thumbAnimateRange={[-10, 36]}
export default MdToggleButton;
