/* @flow 
 * this script takes black/withe tiles and sets their colors on the canvas
 * its used to set the land area on the planet.
 *
 * The tiles it uses are explained in 3dmodels/ocean-tiles
 *
 * run this script with --expose-gc or you run out of RAM
 */


import sharp from 'sharp';
import fs from 'fs';

const CANVAS_SIZE = 256 * 256;
const CANVAS_MIN_XY = -(CANVAS_SIZE / 2);
const CANVAS_MAX_XY = (CANVAS_SIZE / 2) - 1;

const TILEFOLDER = './ocean';
const TILE_SIZE = 2048;
const SMALL_TILE_SIZE = 256;


async function createTiles() {
  const targetfolder = './tmpfolder';
  if (!fs.existsSync(targetfolder)) {
    fs.mkdirSync(targetfolder);
  }

  for (let dx = 0; dx < CANVAS_SIZE / SMALL_TILE_SIZE; dx += 1) {
    const dir = `${targetfolder}/${dx}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  }

  for (let ty = 0; ty < CANVAS_SIZE / TILE_SIZE; ty += 1) {
    for (let tx = 0; tx < CANVAS_SIZE / TILE_SIZE; tx += 1) {
      const [ x, y ] = [tx, ty].map(z => z * TILE_SIZE / SMALL_TILE_SIZE);
      const filename = `${TILEFOLDER}/${tx}/${ty}.png`;
      console.log(`Checking tile ${filename}`);
      if (!fs.existsSync(filename)) continue;
      let tile = await sharp(filename).ensureAlpha().raw().toBuffer();
      tile = new Uint32Array(tile.buffer);
      for (let dxc = 0; dxc < TILE_SIZE / SMALL_TILE_SIZE; dxc += 1) {
        for (let dyc = 0; dyc < TILE_SIZE / SMALL_TILE_SIZE; dyc += 1) {
          const buffer = new Uint32Array(SMALL_TILE_SIZE * SMALL_TILE_SIZE);
          let boff = (dxc + dyc * TILE_SIZE) * SMALL_TILE_SIZE;
          let soff = 0;
          let exists = false;
          for (let column = 0; column < SMALL_TILE_SIZE; column += 1) {
            for (let row = 0; row < SMALL_TILE_SIZE; row += 1) {
              const mask = tile[boff++] & 0x00FFFFFF;
              if (!mask && !exists) {
                exists = true;
              }
              buffer[soff++] = (mask) ? 0xFFFFE3CA : 0xFFFFFFFF;
            }
            boff += TILE_SIZE - SMALL_TILE_SIZE;
          }
          if (exists) {
            const filename = `${targetfolder}/${tx * TILE_SIZE / SMALL_TILE_SIZE + dxc}/${ty * TILE_SIZE / SMALL_TILE_SIZE + dyc}.png`
            await sharp(
              Buffer.from(
                buffer.buffer,
              ), {
                raw: {
                  width: SMALL_TILE_SIZE,
                  height: SMALL_TILE_SIZE,
                  channels: 4,
                },
              },
            ).toFile(filename);
          }
        }
      }
      tile = null;
    }
  }
}

createTiles();
