/* @flow */


import type { ColorIndex } from '../../core/Palette';

type PixelUpdatePacket = {
  x: number,
  y: number,
  pixels: Array,
};

const OP_CODE = 0xC1;

export default {
  OP_CODE,
  hydrate(data: Buffer): PixelUpdatePacket {
    /*
     * chunk coordinates
     */
    const i = data.readUInt8(1);
    const j = data.readUInt8(2);
    /*
     * offset and color of every pixel
     * 3 bytes offset
     * 1 byte color
     */
    const pixels = [];
    let off = data.length;
    while (off >= 3) {
      const color = data.readUInt8(off -= 1);
      const offsetL = data.readUInt16BE(off -= 2);
      const offsetH = data.readUInt8(off -= 1) << 16;
      const pixels.push([offsetH | offsetL, color]);
    }
    return {
      i, j, pixels,
    };
  },

  dehydrate(i, j, pixels): Buffer {
    const buffer = Buffer.allocUnsafe(1 + 1 + 1 + pixels.length * 4);
    buffer.writeUInt8(OP_CODE, 0);
    /*
     * chunk coordinates
     */
    buffer.writeUInt8(i, 1);
    buffer.writeUInt8(j, 2);
    /*
     * offset and color of every pixel
     * 3 bytes offset
     * 1 byte color
     */
    let cnt = 2;
    for (let i = 0; i < pixels.length; i += 1) {
      const [offset, color] = pixels[i];
      buffer.writeUInt8(offset >>> 16, cnt += 1);
      buffer.writeUInt16BE(offset & 0x00FFFF, cnt += 1);
      buffer.writeUInt8(color, cnt += 2);
    }

    return buffer;
  },
};
