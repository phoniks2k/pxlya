/**
 *
 * @flow
 */

import React, { useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { t } from 'ttag';

import CanvasItem from '../CanvasItem';
import { changeWindowType, selectCanvas } from '../../actions';


const CanvasSelect = ({ windowId }) => {
  const [canvases, showHiddenCanvases] = useSelector((state) => [
    state.canvas.canvases,
    state.canvas.showHiddenCanvases,
  ], shallowEqual);
  const dispatch = useDispatch();
  const selCanvas = useCallback((canvasId) => dispatch(selectCanvas(canvasId)),
    [dispatch]);

  return (
    <p style={{
      textAlign: 'center',
      paddingLeft: '5%',
      paddingRight: '5%',
      paddingTop: 20,
    }}
    >
      <p className="modaltext">
        {t`Select the canvas you want to use. \
 Every canvas is unique and has different palettes, cooldown and requirements. \
 Archive of closed canvases can be accessed here:`}&nbsp;
        <span
          role="button"
          tabIndex={0}
          className="modallink"
          onClick={() => dispatch(changeWindowType(windowId, 'ARCHIVE'))}
        >{t`Archive`}</span>)
      </p>
      {
          Object.keys(canvases).map((canvasId) => (
            (!canvases[canvasId].hid || showHiddenCanvases)
              && (
                <CanvasItem
                  canvasId={canvasId}
                  canvas={canvases[canvasId]}
                  selCanvas={selCanvas}
                />
              )
          ))
        }
    </p>
  );
};

export default React.memo(CanvasSelect);
