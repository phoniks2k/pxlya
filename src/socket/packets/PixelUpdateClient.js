/*
 * Packet for sending and receiving pixels per chunk
 * Multiple pixels can be sent at once
 *
 * @flow 
 */


import type { ColorIndex } from '../../core/Palette';

type PixelUpdatePacket = {
  x: number,
  y: number,
  pixels: Array,
};

const OP_CODE = 0xC1;

export default {
  OP_CODE,
  hydrate(data: DataView): PixelUpdatePacket {
    /*
     * chunk coordinates
     */
    const i = data.getUint8(1);
    const j = data.getUint8(2);
    /*
     * offset and color of every pixel
     * 3 bytes offset
     * 1 byte color
     */
    const pixels = [];
    let off = data.byteLength;
    while (off >= 3) {
      const color = data.getUint8(off -= 1);
      const offsetL = data.getUint16(off -= 2);
      const offsetH = data.getUint8(off -= 1) << 16;
      const pixels.push([offsetH | offsetL, color]);
    }
    return {
      i, j, pixels,
    };
  },

  dehydrate(i, j, pixels): Buffer {
    const buffer = new ArrayBuffer(1 + 1 + 1 + pixels.length * 4);
    const view = new DataView(buffer);
    view.setUint8(0, OP_CODE);
    /*
     * chunk coordinates
     */
    view.setUint8(1, i);
    view.setUint8(2, j);
    /*
     * offset and color of every pixel
     * 3 bytes offset
     * 1 byte color
     */
    let cnt = 2;
    for (let i = 0; i < pixels.length; i += 1) {
      const [offset, color] = pixels[i];
      view.setUint8(cnt += 1, offset >>> 16);
      view.setUint16(cnt += 1, offset & 0x00FFFF);
      view.setUint8(cnt += 2, color);
    }

    return buffer;
  },

};
