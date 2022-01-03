/*
 * Packet for sending and receiving pixels per chunk
 * Multiple pixels can be sent at once
 * Server side.
 *
 * */

const OP_CODE = 0xC1;

export default {
  OP_CODE,
  hydrate(data) {
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
    /*
     * limit the max amount of pixels that can be
     * receive to 500
     */
    let pxlcnt = 0;
    while (off > 3 && pxlcnt < 500) {
      const color = data.readUInt8(off -= 1);
      const offsetL = data.readUInt16BE(off -= 2);
      const offsetH = data.readUInt8(off -= 1) << 16;
      pixels.push([offsetH | offsetL, color]);
      pxlcnt += 1;
    }
    return {
      i, j, pixels,
    };
  },

  /*
   * @param chunkId id consisting of chunk coordinates
   * @param pixels Buffer with offset and color of one or more pixels
   */
  dehydrate(chunkId, pixels) {
    const index = new Uint8Array([OP_CODE, chunkId >> 8, chunkId & 0xFF]);
    return Buffer.concat([index, pixels]);
  },
};
