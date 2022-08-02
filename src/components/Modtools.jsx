/*
 * Modtools
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import ModCanvastools from './ModCanvastools';
import Admintools from './Admintools';


const CONTENT = {
  Canvas: ModCanvastools,
  Admin: Admintools,
};

function Modtools() {
  const [selectedPart, selectPart] = useState('canvas');

  const userlvl = useSelector((state) => state.user.userlvl);

  const Content = CONTENT[selectedPart];

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        {Object.keys(CONTENT)
          .filter((part) => part !== 'Admin' || userlvl === 1)
          .map((part) => (
            <span
              role="button"
              tabIndex={-1}
              key={part}
              className="modallink"
              style={(selectedPart === part) && {
                fontWeight: 'bold',
              }}
              onClick={() => selectPart(part)}
            >{part}</span>
          ),
          )}
      </div>
      <div className="modaldivider" />
      {Content && <Content />}
    </>
  );
}

export default React.memo(Modtools);
