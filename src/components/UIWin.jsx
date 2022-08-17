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
    <>
      {(windowType)
        ? <Content />
        : <h1>Loading</h1>}
    </>
  );
};

export default React.memo(UIWin);
