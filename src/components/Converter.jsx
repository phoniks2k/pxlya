/**
 *
 * @flow
 */

import React, { useState, useEffect } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import fileDownload from 'js-file-download';
import iq from 'image-q';
import { jt, t } from 'ttag';

import printGIMPPalette from '../core/exportGPL';
import { copyCanvasToClipboard } from '../utils/clipboard';


function downloadOutput() {
  const output = document.getElementById('imgoutput');
  output.toBlob((blob) => fileDownload(blob, 'ppfunconvert.png'));
}

function readFile(
  file,
  selectFile,
  setScaleData,
) {
  if (!file) {
    return;
  }
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      setScaleData({
        enabled: false,
        width: img.width,
        height: img.height,
        aa: true,
      });
      selectFile(img);
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}

const ColorDistanceCalculators = [
  'Euclidean',
  'Manhattan',
  'CIEDE2000',
  'CIE94Textiles',
  'CIE94GraphicArts',
  'EuclideanBT709NoAlpha',
  'EuclideanBT709',
  'ManhattanBT709',
  'CMetric',
  'PNGQuant',
  'ManhattanNommyde',
];

function quantize(
  pointContainer,
  colors,
  colorDist,
  strategy,
  onProgress,
) {
  return new Promise((resolve, reject) => {
    // read colors into palette
    const palette = new iq.utils.Palette();
    palette.add(iq.utils.Point.createByRGBA(0, 0, 0, 0));
    colors.forEach((clr) => {
      const [r, g, b] = clr;
      const point = iq.utils.Point.createByRGBA(r, g, b, 255);
      palette.add(point);
    });
    // construct color distance calculator
    let distance;
    switch (colorDist) {
      case 'Euclidean':
        distance = new iq.distance.Euclidean();
        break;
      case 'Manhattan':
        distance = new iq.distance.Manhattan();
        break;
      case 'CIEDE2000':
        distance = new iq.distance.CIEDE2000();
        break;
      case 'CIE94Textiles':
        distance = new iq.distance.CIE94Textiles();
        break;
      case 'CIE94GraphicArts':
        distance = new iq.distance.CIE94GraphicArts();
        break;
      case 'EuclideanBT709NoAlpha':
        distance = new iq.distance.EuclideanBT709NoAlpha();
        break;
      case 'EuclideanBT709':
        distance = new iq.distance.EuclideanBT709();
        break;
      case 'ManhattanBT709':
        distance = new iq.distance.ManhattanBT709();
        break;
      case 'CMetric':
        distance = new iq.distance.CMetric();
        break;
      case 'PNGQuant':
        distance = new iq.distance.PNGQuant();
        break;
      case 'ManhattanNommyde':
        distance = new iq.distance.ManhattanNommyde();
        break;
      default:
        distance = new iq.distance.Euclidean();
    }
    // construct image quantizer
    let imageQuantizer;
    if (strategy === 'Nearest') {
      imageQuantizer = new iq.image.NearestColor(distance);
    } else if (strategy === 'Riemersma') {
      imageQuantizer = new iq.image.ErrorDiffusionRiemersma(distance);
    } else {
      imageQuantizer = new iq.image.ErrorDiffusionArray(
        distance,
        iq.image.ErrorDiffusionArrayKernel[strategy],
        true,
        0,
        false,
      );
    }
    // quantize
    let outPointContainer;
    const iterator = imageQuantizer.quantize(pointContainer, palette);
    const next = () => {
      try {
        const result = iterator.next();
        if (result.done) {
          resolve(outPointContainer);
        } else {
          if (result.value.pointContainer) {
            outPointContainer = result.value.pointContainer;
          }
          if (onProgress) onProgress(result.value.progress);
          setTimeout(next, 10);
        }
      } catch (error) {
        reject(error);
      }
    };
    setTimeout(next, 10);
  });
}

function drawPixels(idxi8, width, height) {
  const can = document.createElement('canvas');
  can.width = width;
  can.height = height;
  const ctx = can.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;

  const imgd = ctx.createImageData(can.width, can.height);
  const { data } = imgd;
  for (let i = 0, len = data.length; i < len; ++i) data[i] = idxi8[i];

  ctx.putImageData(imgd, 0, 0);
  return can;
}

function addGrid(img, lightGrid, offsetX, offsetY) {
  const can = document.createElement('canvas');
  const ctx = can.getContext('2d');
  can.width = img.width * 5;
  can.height = img.height * 5;
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.save();
  ctx.scale(5.0, 5.0);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
  ctx.fillStyle = (lightGrid) ? '#DDDDDD' : '#222222';
  for (let i = 0; i <= img.width; i += 1) {
    const thick = ((i + (offsetX * 1)) % 10 === 0) ? 2 : 1;
    ctx.fillRect(i * 5, 0, thick, can.height);
  }
  for (let j = 0; j <= img.height; j += 1) {
    const thick = ((j + (offsetY * 1)) % 10 === 0) ? 2 : 1;
    ctx.fillRect(0, j * 5, can.width, thick);
  }
  return can;
}

function scaleImage(img, width, height, doAA) {
  const can = document.createElement('canvas');
  const ctxo = can.getContext('2d');
  can.width = width;
  can.height = height;
  const scaleX = width / img.width;
  const scaleY = height / img.height;
  if (doAA) {
    // scale with canvas for antialiasing
    ctxo.save();
    ctxo.scale(scaleX, scaleY);
    ctxo.drawImage(img, 0, 0);
    ctxo.restore();
    return can;
  }
  // scale manually
  const imdo = ctxo.createImageData(width, height);
  const { data: datao } = imdo;
  const cani = document.createElement('canvas');
  cani.width = img.width;
  cani.height = img.height;
  const ctxi = cani.getContext('2d');
  ctxi.drawImage(img, 0, 0);
  const imdi = ctxi.getImageData(0, 0, img.width, img.height);
  const { data: datai } = imdi;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let posi = (Math.round(x / scaleX) + Math.round(y / scaleY)
          * img.width) * 4;
      let poso = (x + y * width) * 4;
      datao[poso++] = datai[posi++];
      datao[poso++] = datai[posi++];
      datao[poso++] = datai[posi++];
      datao[poso] = datai[posi];
    }
  }
  ctxo.putImageData(imdo, 0, 0);
  return can;
}

let newOpts = null;
let rendering = false;
async function renderOutputImage(opts) {
  if (!opts.file) {
    return;
  }
  if (rendering) {
    newOpts = opts;
    return;
  }
  rendering = true;
  let renderOpts = opts;
  while (renderOpts) {
    newOpts = null;
    const {
      file, dither, grid, scaling,
    } = renderOpts;
    if (file) {
      let image = file;
      let pointContainer = null;
      if (scaling.enabled) {
        // scale
        const { width, height, aa } = scaling;
        image = scaleImage(
          file,
          width,
          height,
          aa,
        );
        pointContainer = iq.utils.PointContainer.fromHTMLCanvasElement(image);
      } else {
        pointContainer = iq.utils.PointContainer.fromHTMLImageElement(image);
      }
      // dither
      const { colors, strategy, colorDist } = dither;
      const progEl = document.getElementById('qprog');
      // eslint-disable-next-line no-await-in-loop
      pointContainer = await quantize(
        pointContainer,
        colors,
        colorDist,
        strategy,
        (progress) => {
          progEl.innerHTML = `Loading... ${Math.round(progress)} %`;
        },
      );
      progEl.innerHTML = 'Done';
      image = drawPixels(
        pointContainer.toUint8Array(),
        image.width,
        image.height,
      );
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
      ctx.drawImage(image, 0, 0);
    }
    // render again if requested in the meantime
    renderOpts = newOpts;
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
  const [selectedFile, selectFile] = useState(null);
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
    if (selectedFile) {
      const canvas = canvases[selectedCanvas];
      const dither = {
        colors: canvas.colors.slice(canvas.cli),
        strategy: selectedStrategy,
        colorDist: selectedColorDist,
      };
      renderOutputImage({
        file: selectedFile,
        dither,
        grid: gridData,
        scaling: scaleData,
      });
    }
  });

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
                  selected={canvas === selectedCanvas}
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
        onChange={(evt) => {
          const fileSel = evt.target;
          const file = (!fileSel.files || !fileSel.files[0])
            ? null : fileSel.files[0];
          readFile(file, selectFile, setScaleData);
        }}
      />
      <p className="modalcotext">{t`Choose Strategy`}:&nbsp;
        <select
          onChange={(e) => {
            const sel = e.target;
            selectStrategy(sel.options[sel.selectedIndex].value);
          }}
        >
          {
            ['Nearest',
              'Riemersma',
              ...Object.keys(iq.image.ErrorDiffusionArrayKernel),
            ].map((strat) => (
              <option
                value={strat}
                selected={(selectedStrategy === strat)}
              >{strat}</option>
            ))
          }
        </select>
      </p>
      <p className="modalcotext">{t`Choose Color Mode`}:&nbsp;
        <select
          onChange={(e) => {
            const sel = e.target;
            selectColorDist(sel.options[sel.selectedIndex].value);
          }}
        >
          {
            ColorDistanceCalculators.map((strat) => (
              <option
                value={strat}
                selected={(selectedColorDist === strat)}
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
                  if (selectedScaleKeepRatio && selectedFile) {
                    const ratio = selectedFile.width / selectedFile.height;
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
                  if (selectedScaleKeepRatio && selectedFile) {
                    const ratio = selectedFile.width / selectedFile.height;
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
                if (selectedFile) {
                  setScaleData({
                    ...scaleData,
                    width: selectedFile.width,
                    height: selectedFile.height,
                  });
                }
              }}
            >
              {t`Reset`}
            </button>
          </div>
        )
        : null}
      {(selectedFile)
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

export default React.memo(Converter);
