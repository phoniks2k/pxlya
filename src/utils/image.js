/**
 * Basic image manipulation and quantization
 *
 * @flow
 */

import { utils, distance, image } from 'image-q';


export const ColorDistanceCalculators = [
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

export const ImageQuantizerKernels = [
  'Nearest',
  'Riemersma',
  'FloydSteinberg',
  'FalseFloydSteinberg',
  'Stucki',
  'Atkinson',
  'Jarvis',
  'Burkes',
  'Sierra',
  'TwoSierra',
  'SierraLite',
];

export function getImageDataOfFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const cani = document.createElement('canvas');
        cani.width = img.width;
        cani.height = img.height;
        const ctxi = cani.getContext('2d');
        ctxi.drawImage(img, 0, 0);
        const imdi = ctxi.getImageData(0, 0, img.width, img.height);
        resolve(imdi);
      };
      img.onerror = (error) => reject(error);
      img.src = fr.result;
    };
    fr.onerror = (error) => reject(error);
    fr.readAsDataURL(file);
  });
}

function createPointContainerFromImageData(imageData) {
  const { width, height, data } = imageData;
  console.log('create container from image data', data);
  const pointContainer = new utils.PointContainer();
  pointContainer.setWidth(width);
  pointContainer.setHeight(height);
  const pointArray = pointContainer.getPointArray();
  let i = 0;
  while (i < data.length) {
    const point = utils.Point.createByRGBA(
      data[i++],
      data[i++],
      data[i++],
      data[i++],
    );
    pointArray.push(point);
  }
  return pointContainer;
}

function createImageDataFromPointContainer(pointContainer) {
  const width = pointContainer.getWidth();
  const height = pointContainer.getHeight();
  const data = pointContainer.toUint8Array();
  const can = document.createElement('canvas');
  can.width = width;
  can.height = height;
  const ctx = can.getContext('2d');
  const idata = ctx.createImageData(width, height);
  idata.data.set(data);
  return idata;
}

export function quantizeImage(colors, imageData, opts) {
  console.log('quantize image');
  return new Promise((resolve, reject) => {
    const pointContainer = createPointContainerFromImageData(imageData);
    const strategy = opts.strategy || 'Nearest';
    const colorDist = opts.colorDist || 'Euclidean';
    // create palette
    const palette = new utils.Palette();
    palette.add(utils.Point.createByRGBA(0, 0, 0, 0));
    for (let i = 0; i < colors.length; i += 1) {
      const [r, g, b] = colors[i];
      const point = utils.Point.createByRGBA(r, g, b, 255);
      palette.add(point);
    }
    console.log('palette', palette);
    // construct color distance calculator
    let distCalc;
    switch (colorDist) {
      case 'Euclidean':
        distCalc = new distance.Euclidean();
        break;
      case 'Manhattan':
        distCalc = new distance.Manhattan();
        break;
      case 'CIEDE2000':
        distCalc = new distance.CIEDE2000();
        break;
      case 'CIE94Textiles':
        distCalc = new distance.CIE94Textiles();
        break;
      case 'CIE94GraphicArts':
        distCalc = new distance.CIE94GraphicArts();
        break;
      case 'EuclideanBT709NoAlpha':
        distCalc = new distance.EuclideanBT709NoAlpha();
        break;
      case 'EuclideanBT709':
        distCalc = new distance.EuclideanBT709();
        break;
      case 'ManhattanBT709':
        distCalc = new distance.ManhattanBT709();
        break;
      case 'CMetric':
        distCalc = new distance.CMetric();
        break;
      case 'PNGQuant':
        distCalc = new distance.PNGQuant();
        break;
      case 'ManhattanNommyde':
        distCalc = new distance.ManhattanNommyde();
        break;
      default:
        distCalc = new distance.Euclidean();
    }
    // idk why i need this :/
    if (distCalc._setDefaults) distCalc._setDefaults();
    // construct image quantizer
    let imageQuantizer;
    if (strategy === 'Nearest') {
      imageQuantizer = new image.NearestColor(distCalc);
    } else if (strategy === 'Riemersma') {
      imageQuantizer = new image.ErrorDiffusionRiemersma(distCalc);
    } else {
      imageQuantizer = new image.ErrorDiffusionArray(
        distCalc,
        image.ErrorDiffusionArrayKernel[strategy],
        true,
        0,
        false,
      );
    }
    console.log('quantizer', imageQuantizer);
    // quantize
    let outPointContainer;
    const iterator = imageQuantizer.quantize(pointContainer, palette);
    const next = () => {
      try {
        const result = iterator.next();
        if (result.done) {
          resolve(createImageDataFromPointContainer(outPointContainer));
        } else {
          if (result.value.pointContainer) {
            outPointContainer = result.value.pointContainer;
          }
          if (opts.onProgress) opts.onProgress(result.value.progress);
          setTimeout(next, 0);
        }
      } catch (error) {
        reject(error);
      }
    };
    setTimeout(next, 0);
  });
}
