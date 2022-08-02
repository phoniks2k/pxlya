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
  const [selectedPart, selectPart] = useState('Canvas');

  const userlvl = useSelector((state) => state.user.userlvl);

  const Content = CONTENT[selectedPart];

  const parts = Object.keys(CONTENT)
    .filter((part) => part !== 'Admin' || userlvl === 1);

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        {parts.map((part, ind) => (
          <React.Fragment key={part}>
            <span
              role="button"
              tabIndex={-1}
              className="modallink"
              style={(selectedPart === part) ? {
                fontWeight: 'bold',
              } : {}}
              onClick={() => selectPart(part)}
            >{part}</span>
            {(ind !== parts.length - 1)
              && <span className="hdivider" />}
          </React.Fragment>
        ))}
      </div>
      <div className="modaldivider" />
      {Content && <Content />}
    </>
  );
}

export default React.memo(Modtools);
