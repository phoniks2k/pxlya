/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import CanvasItem from './CanvasItem';
import { showArchiveModal } from '../actions';

import type { State } from '../reducers';


const CanvasSelectModal = ({
  canvases,
  showHiddenCanvases,
  showArchive,
}) => (
  <p style={{
    textAlign: 'center',
    paddingLeft: '5%',
    paddingRight: '5%',
    paddingTop: 20,
  }}
  >
    <p className="modaltext">
      Select the canvas you want to use.
      Every canvas is unique and has different palettes,
      cooldown and requirements. Archive of closed canvases can be
      accessed&nbsp;
      <span
        role="button"
        tabIndex={0}
        className="modallink"
        onClick={showArchive}
      >here</span>.
    </p>
    {
      Object.keys(canvases).map((canvasId) => (
        (canvases[canvasId].hid && !showHiddenCanvases)
          ? null
          : <CanvasItem canvasId={canvasId} canvas={canvases[canvasId]} />
      ))
    }
  </p>
);

function mapDispatchToProps(dispatch) {
  return {
    showArchive() {
      dispatch(showArchiveModal());
    },
  };
}

function mapStateToProps(state: State) {
  const {
    canvases,
    showHiddenCanvases,
  } = state.canvas;
  return { canvases, showHiddenCanvases };
}

const data = {
  content: connect(mapStateToProps, mapDispatchToProps)(CanvasSelectModal),
  title: 'Canvas Selection',
};

export default data;
