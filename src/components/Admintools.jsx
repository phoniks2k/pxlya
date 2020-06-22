/*
 * Html for adminpage
 *
 * @flow
 */

import React, { useState } from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';


async function submitAction(
  action,
  canvas,
  coords,
  callback,
) {
  const data = new FormData();
  const fileSel = document.getElementById('imgfile');
  const file = (!fileSel.files || !fileSel.files[0])
    ? null : fileSel.files[0];
  data.append('imageaction', action);
  data.append('image', file);
  data.append('canvasid', canvas);
  data.append('coords', coords);
  const resp = await fetch('./admintools', {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  callback(await resp.text());
}

async function submitIPAction(
  action,
  callback,
) {
  const data = new FormData();
  const iplist = document.getElementById('iparea').value;
  data.append('ip', iplist);
  data.append('ipaction', action);
  const resp = await fetch('./admintools', {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  callback(await resp.text());
}


function Admintools({
  canvasId,
  canvases,
}) {
  const [selectedCanvas, selectCanvas] = useState(canvasId);
  const [imageAction, selectImageAction] = useState('build');
  const [iPAction, selectIPAction] = useState('ban');
  const [resp, setResp] = useState(null);
  const [coords, selectCoords] = useState('X_Y');
  const [submitting, setSubmitting] = useState(false);

  let descAction;
  switch (imageAction) {
    case 'build':
      descAction = 'Build image on canvas.';
      break;
    case 'protect':
      descAction = 'Build image and set it to protected.';
      break;
    case 'wipe':
      descAction = 'Build image, but reset cooldown to unset-pixel cd.';
      break;
    default:
      // nothing
  }

  return (
    <p style={{ textAlign: 'center', paddingLeft: '5%', paddingRight: '5%' }}>
      {resp && (
        <div style={{
          borderStyle: 'solid',
          borderColor: '#D4D4D4',
          borderWidth: 2,
          padding: 5,
          display: 'inline-block',
        }}
        >
          {resp.split('\n').map((line) => (
            <p className="modaltext">
              {line}
            </p>
          ))}
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => setResp(null)}
          >
            Close
          </span>
        </div>
      )}
      <h3 className="modaltitle">Image Upload</h3>
      <p className="modalcotext">Upload images to canvas</p>
      <p className="modalcotext">Choose Canvas:&nbsp;
        <select
          onChange={(e) => {
            const sel = e.target;
            selectCanvas(sel.options[sel.selectedIndex].value);
          }}
        >
          {
          Object.keys(canvases).map((canvas) => ((canvases[canvas].v)
            ? null
            : (
              <option
                selected={canvas === selectedCanvas}
                value={canvas}
              >
                {
              canvases[canvas].title
            }
              </option>
            )))
        }
        </select>
      </p>
      <p className="modalcotext">
        File:&nbsp;
        <input type="file" name="image" id="imgfile" />
      </p>
      <select
        onChange={(e) => {
          const sel = e.target;
          selectImageAction(sel.options[sel.selectedIndex].value);
        }}
      >
        {['build', 'protect', 'wipe'].map((opt) => (
          <option
            value={opt}
            selected={imageAction === opt}
          >
            {opt}
          </option>
        ))}
      </select>
      <p className="modalcotext">{descAction}</p>
      <p className="modalcotext">
        Coordinates in X_Y format:&nbsp;
        <input
          value={coords}
          style={{
            display: 'inline-block',
            width: '100%',
            maxWidth: '15em',
          }}
          type="text"
          onChange={(evt) => {
            selectCoords(evt.target.value.trim());
          }}
        />
      </p>
      <button
        type="button"
        onClick={() => {
          if (submitting) {
            return;
          }
          setSubmitting(true);
          submitAction(
            imageAction,
            selectedCanvas,
            coords,
            (ret) => {
              setSubmitting(false);
              setResp(ret);
            },
          );
        }}
      >
        {(submitting) ? '...' : 'Submit'}
      </button>
      <br />
      <div className="modaldivider" />
      <h3 className="modaltitle">IP Actions</h3>
      <p className="modalcotext">Do stuff with IPs (one IP per line)</p>
      <select
        onChange={(e) => {
          const sel = e.target;
          selectIPAction(sel.options[sel.selectedIndex].value);
        }}
      >
        {['ban', 'unban', 'whitelist', 'unwhitelist'].map((opt) => (
          <option
            value={opt}
            selected={iPAction === opt}
          >
            {opt}
          </option>
        ))}
      </select>
      <br />
      <textarea rows="10" cols="100" id="iparea" /><br />
      <button
        type="button"
        onClick={() => {
          if (submitting) {
            return;
          }
          setSubmitting(true);
          submitIPAction(
            iPAction,
            (ret) => {
              setSubmitting(false);
              setResp(ret);
            },
          );
        }}
      >
        {(submitting) ? '...' : 'Submit'}
      </button>
    </p>
  );
}

function mapStateToProps(state: State) {
  const { canvasId, canvases } = state.canvas;
  return { canvasId, canvases };
}

export default connect(mapStateToProps)(Admintools);
