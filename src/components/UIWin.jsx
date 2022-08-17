/*
 *
 */

import React from 'react';
import { useSelector } from 'react-redux';

import { selectWindowType } from '../store/selectors/win';
import COMPONENTS from './windows';

const UIWin = () => {
  const windowType = useSelector(selectWindowType);

  const [Content, name] = COMPONENTS[windowType];

  return (
    <div
      className="window show"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {(windowType)
        ? <Content />
        : <h1>Loading</h1>}
    </div>
  );
};

export default React.memo(UIWin);
