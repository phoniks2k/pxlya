/*
 *
 */

import React from 'react';
import { useSelector } from 'react-redux';

function Style() {
  const style = useSelector((state) => state.gui.style);
  const cssUri = window.ssv.availableStyles[style];
  return (style === 'default') ? null
    : (<link rel="stylesheet" type="text/css" href={cssUri} />);
}

export default React.memo(Style);
