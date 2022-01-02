/**
 *
 * @flow
 */

import React, { useState, useEffect } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import fileDownload from 'js-file-download';
import { jt, t } from 'ttag';

import {
  ColorDistanceCalculators,
  ImageQuantizerKernels,
  quantizeImage,
  getImageDataOfFile,
} from '../utils/image';
import printGIMPPalette from '../core/exportGPL';
import { copyCanvasToClipboard } from '../utils/clipboard';


function downloadOutput() {
  const output = document.getElementById('imgoutput');
  output.toBlob((blob) => fileDownload(blob, 'ppfunconvert.png'));
}

function createCanvasFromImageData(imgData) {
  const { width, height } = imgData;
  const inputCanvas = document.createElement('canvas');
  inputCanvas.width = width;
  inputCanvas.height = height;
  const inputCtx = inputCanvas.getContext('2d');
  inputCtx.putImageData(imgData, 0, 0);
  return inputCanvas;
}

function addGrid(imgData, lightGrid, offsetX, offsetY) {
  const image = createCanvasFromImageData(imgData);
  const { width, height } = image;
  const can = document.createElement('canvas');
  const ctx = can.getContext('2d');
  can.width = width * 5;
  can.height = height * 5;
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.save();
  ctx.scale(5.0, 5.0);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
  ctx.fillStyle = (lightGrid) ? '#DDDDDD' : '#222222';
  for (let i = 0; i <= width; i += 1) {
    const thick = ((i + (offsetX * 1)) % 10 === 0) ? 2 : 1;
    ctx.fillRect(i * 5, 0, thick, can.height);
  }
  for (let j = 0; j <= height; j += 1) {
    const thick = ((j + (offsetY * 1)) % 10 === 0) ? 2 : 1;
    ctx.fillRect(0, j * 5, can.width, thick);
  }
  return ctx.getImageData(0, 0, can.width, can.height);
}

function scaleImage(imgData, width, height, doAA) {
  const can = document.createElement('canvas');
  const ctxo = can.getContext('2d');
  can.width = width;
  can.height = height;
  const scaleX = width / imgData.width;
  const scaleY = height / imgData.height;
  if (doAA) {
    // scale with canvas for antialiasing
    const image = createCanvasFromImageData(imgData);
    ctxo.save();
    ctxo.scale(scaleX, scaleY);
    ctxo.drawImage(image, 0, 0);
    ctxo.restore();
    return ctxo.getImageData(0, 0, width, height);
  }
  // scale manually
  const imdo = ctxo.createImageData(width, height);
  const { data: datao } = imdo;
  const { data: datai } = imgData;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let posi = (Math.round(x / scaleX) + Math.round(y / scaleY)
          * imgData.width) * 4;
      let poso = (x + y * width) * 4;
      datao[poso++] = datai[posi++];
      datao[poso++] = datai[posi++];
      datao[poso++] = datai[posi++];
      datao[poso] = datai[posi];
    }
  }
  return imdo;
}

let renderOpts = null;
let rendering = false;
async function renderOutputImage(opts) {
  if (!opts.file) {
    return;
  }
  renderOpts = opts;
  if (rendering) {
    console.log('skip rendering');
    return;
  }
  console.log('render');
  rendering = true;
  while (renderOpts) {
    const {
      file, dither, grid, scaling,
    } = renderOpts;
    renderOpts = null;
    if (file) {
      let image = file;
      if (scaling.enabled) {
        // scale
        const { width, height, aa } = scaling;
        image = scaleImage(
          file,
          width,
          height,
          aa,
        );
      }
      // dither
      const { colors, strategy, colorDist } = dither;
      const progEl = document.getElementById('qprog');
      // eslint-disable-next-line no-await-in-loop
      image = await quantizeImage(colors, image, {
        strategy,
        colorDist,
        onProgress: (progress) => {
          progEl.innerHTML = `Loading... ${Math.round(progress)} %`;
        },
      });
      progEl.innerHTML = 'Done';
      // grid
      if (grid.enabled) {
        const { light, offsetX, offsetY } = grid;
        image = addGrid(
          image,
          light,
          offsetX,
          offsetY,
        );
      }
      // draw
      const output = document.getElementById('imgoutput');
      output.width = image.width;
      output.height = image.height;
      const ctx = output.getContext('2d');
      ctx.putImageData(image, 0, 0);
    }
  }
  rendering = false;
}


function Converter() {
  const [
    canvasId,
    canvases,
    showHiddenCanvases,
  ] = useSelector((state) => [
    state.canvas.canvasId,
    state.canvas.canvases,
    state.canvas.showHiddenCanvases,
  ], shallowEqual);

  const [selectedCanvas, selectCanvas] = useState(canvasId);
  const [inputImageData, setInputImageData] = useState(null);
  const [selectedStrategy, selectStrategy] = useState('Nearest');
  const [selectedColorDist, selectColorDist] = useState('Euclidean');
  const [selectedScaleKeepRatio, selectScaleKeepRatio] = useState(true);
  const [scaleData, setScaleData] = useState({
    enabled: false,
    width: 10,
    height: 10,
    aa: true,
  });
  const [gridData, setGridData] = useState({
    enabled: true,
    light: false,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    if (inputImageData) {
      const canvas = canvases[selectedCanvas];
      const dither = {
        colors: canvas.colors.slice(canvas.cli),
        strategy: selectedStrategy,
        colorDist: selectedColorDist,
      };
      renderOutputImage({
        file: inputImageData,
        dither,
        grid: gridData,
        scaling: scaleData,
      });
    }
  }, [
    inputImageData,
    selectedStrategy,
    selectedColorDist,
    scaleData,
    selectedCanvas,
    gridData,
  ]);

  const {
    enabled: gridEnabled,
    light: gridLight,
    offsetX: gridOffsetX,
    offsetY: gridOffsetY,
  } = gridData;
  const {
    enabled: scalingEnabled,
    width: scalingWidth,
    height: scalingHeight,
    aa: scalingAA,
  } = scaleData;

  const gimpLink = <a href="https://www.gimp.org">GIMP</a>;
  const starhouseLink = (
    <a href="https://twitter.com/starhousedev">
      starhouse
    </a>
  );

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="modalcotext">{t`Choose Canvas`}:&nbsp;
        <select
          value={selectedCanvas}
          onChange={(e) => {
            const sel = e.target;
            selectCanvas(sel.options[sel.selectedIndex].value);
          }}
        >
          {
          Object.keys(canvases).map((canvas) => (
            (canvases[canvas].v
              || (canvases[canvas].hid && !showHiddenCanvases))
              ? null
              : (
                <option
                  value={canvas}
                >
                  {
              canvases[canvas].title
            }
                </option>
              )
          ))
        }
        </select>
      </div>
      <h3 className="modaltitle">{t`Palette Download`}</h3>
      <div className="modalcotext">
        {jt`Palette for ${gimpLink}`}:&nbsp;
        <button
          type="button"
          style={{ display: 'inline' }}
          onClick={() => {
            const canvas = canvases[selectedCanvas];
            const {
              title, desc, colors, cli,
            } = canvas;
            fileDownload(
              printGIMPPalette(title, desc, colors.slice(cli)),
              `Pixelplanet${title}.gpl`,
            );
          }}
        >
          Download
        </button>
        <p>
          {jt`Credit for the Palette of the Moon goes to ${starhouseLink}.`}
        </p>
      </div>
      <h3 className="modaltitle">{t`Image Converter`}</h3>
      <p className="modalcotext">{t`Convert an image to canvas colors`}</p>
      <input
        type="file"
        id="imgfile"
        onChange={async (evt) => {
          const fileSel = evt.target;
          const file = (!fileSel.files || !fileSel.files[0])
            ? null : fileSel.files[0];
          const imageData = await getImageDataOfFile(file);
          setInputImageData(null);
          setScaleData({
            enabled: false,
            width: imageData.width,
            height: imageData.height,
            aa: true,
          });
          setInputImageData(imageData);
        }}
      />
      <p className="modalcotext">{t`Choose Strategy`}:&nbsp;
        <select
          value={selectedStrategy}
          onChange={(e) => {
            const sel = e.target;
            selectStrategy(sel.options[sel.selectedIndex].value);
          }}
        >
          {
            ImageQuantizerKernels.map((strat) => (
              <option
                value={strat}
              >{strat}</option>
            ))
          }
        </select>
      </p>
      <p className="modalcotext">{t`Choose Color Mode`}:&nbsp;
        <select
          value={selectedColorDist}
          onChange={(e) => {
            const sel = e.target;
            selectColorDist(sel.options[sel.selectedIndex].value);
          }}
        >
          {
            ColorDistanceCalculators.map((strat) => (
              <option
                value={strat}
              >{strat}</option>
            ))
          }
        </select>
      </p>
      <p style={{ fontHeight: 16 }} className="modalcotext">
        <input
          type="checkbox"
          checked={gridEnabled}
          onChange={(e) => {
            setGridData({
              ...gridData,
              enabled: e.target.checked,
            });
          }}
        />
        {t`Add Grid (uncheck if you need a 1:1 template)`}
      </p>
      {(gridEnabled)
        ? (
          <div style={{
            borderStyle: 'solid',
            borderColor: '#D4D4D4',
            borderWidth: 2,
            padding: 5,
            display: 'inline-block',
          }}
          >
            <p style={{ fontHeight: 16 }} className="modalcotext">
              <input
                type="checkbox"
                checked={gridLight}
                onChange={(e) => {
                  setGridData({
                    ...gridData,
                    light: e.target.checked,
                  });
                }}
              />
              {t`Light Grid`}
            </p>
            <span className="modalcotext">{t`Offset`} X:&nbsp;
              <input
                type="number"
                step="1"
                min="0"
                max="10"
                style={{ width: '2em' }}
                value={gridOffsetX}
                onChange={(e) => {
                  setGridData({
                    ...gridData,
                    offsetX: e.target.value,
                  });
                }}
              />&nbsp;
            </span>
            <span className="modalcotext">{t`Offset`} Y:&nbsp;
              <input
                type="number"
                step="1"
                min="0"
                max="10"
                style={{ width: '2em' }}
                value={gridOffsetY}
                onChange={(e) => {
                  setGridData({
                    ...gridData,
                    offsetY: e.target.value,
                  });
                }}
              />
            </span>
          </div>
        )
        : null}
      <p style={{ fontHeight: 16 }} className="modalcotext">
        <input
          type="checkbox"
          checked={scalingEnabled}
          onChange={(e) => {
            setScaleData({
              ...scaleData,
              enabled: e.target.checked,
            });
          }}
        />
        {t`Scale Image`}
      </p>
      {(scalingEnabled)
        ? (
          <div style={{
            borderStyle: 'solid',
            borderColor: '#D4D4D4',
            borderWidth: 2,
            padding: 5,
            display: 'inline-block',
          }}
          >
            <span className="modalcotext">{t`Width`}:&nbsp;
              <input
                type="number"
                step="1"
                min="1"
                max="1024"
                style={{ width: '3em' }}
                value={scalingWidth}
                onChange={(e) => {
                  const newWidth = (e.target.value > 1024)
                    ? 1024 : e.target.value;
                  if (!newWidth) return;
                  if (selectedScaleKeepRatio && inputImageData) {
                    const ratio = inputImageData.width / inputImageData.height;
                    const newHeight = Math.round(newWidth / ratio);
                    if (newHeight <= 0) return;
                    setScaleData({
                      ...scaleData,
                      width: newWidth,
                      height: newHeight,
                    });
                    return;
                  }
                  setScaleData({
                    ...scaleData,
                    width: newWidth,
                  });
                }}
              />&nbsp;
            </span>
            <span className="modalcotext">{t`Height`}:&nbsp;
              <input
                type="number"
                step="1"
                min="1"
                max="1024"
                style={{ width: '3em' }}
                value={scalingHeight}
                onChange={(e) => {
                  const nuHeight = (e.target.value > 1024)
                    ? 1024 : e.target.value;
                  if (!nuHeight) return;
                  if (selectedScaleKeepRatio && inputImageData) {
                    const ratio = inputImageData.width / inputImageData.height;
                    const nuWidth = Math.round(ratio * nuHeight);
                    if (nuWidth <= 0) return;
                    setScaleData({
                      ...scaleData,
                      width: nuWidth,
                      height: nuHeight,
                    });
                    return;
                  }
                  setScaleData({
                    ...scaleData,
                    height: nuHeight,
                  });
                }}
              />
            </span>
            <p style={{ fontHeight: 16 }} className="modalcotext">
              <input
                type="checkbox"
                checked={selectedScaleKeepRatio}
                onChange={(e) => {
                  selectScaleKeepRatio(e.target.checked);
                }}
              />
              {t`Keep Ratio`}
            </p>
            <p style={{ fontHeight: 16 }} className="modalcotext">
              <input
                type="checkbox"
                checked={scalingAA}
                onChange={(e) => {
                  setScaleData({
                    ...scaleData,
                    aa: e.target.checked,
                  });
                }}
              />
              {t`Anti Aliasing`}
            </p>
            <button
              type="button"
              onClick={() => {
                if (inputImageData) {
                  setScaleData({
                    ...scaleData,
                    width: inputImageData.width,
                    height: inputImageData.height,
                  });
                }
              }}
            >
              {t`Reset`}
            </button>
          </div>
        )
        : null}
      {(inputImageData)
        ? (
          <div>
            <p id="qprog">...</p>
            <p>
              <canvas
                id="imgoutput"
                style={{ width: '80%', imageRendering: 'crisp-edges' }}
              />
            </p>
            <button
              type="button"
              onClick={downloadOutput}
            >
              {t`Download Template`}
            </button>
            {(typeof ClipboardItem === 'undefined')
              ? null
              : (
                <button
                  type="button"
                  onClick={() => {
                    const output = document.getElementById('imgoutput');
                    copyCanvasToClipboard(output);
                  }}
                >
                  {t`Copy to Clipboard`}
                </button>
              )}
          </div>
        ) : null}
    </div>
  );
}

export default Converter;
