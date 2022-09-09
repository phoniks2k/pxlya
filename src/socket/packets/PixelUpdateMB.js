/*
 * Packet for sending and receiving pixels over Message Broker between shards
 * Multiple pixels can be sent at once
 *
 */

const OP_CODE = 0xC1;

export default {
  OP_CODE,
  /*
   * returns info and PixelUpdate package to send to clients
   */
  hydrate(data) {
    const canvasId = data[1];
    data.writeUInt8(OP_CODE, 1);
    const chunkId = data.readUInt16BE(2);
    const pixelUpdate = Buffer.from(
      data.buffer,
      data.byteOffset + 1,
      data.length - 1,
    );
    return [
      canvasId,
      chunkId,
      pixelUpdate,
    ];
  },

  /*
   * @param canvasId
   * @param chunkId id consisting of chunk coordinates
   * @param pixels Buffer with offset and color of one or more pixels
   */
  dehydrate(canvasId, i, j, pixels) {
    const index = new Uint8Array([
      OP_CODE,
      canvasId,
      i,
      j,
    ]);
    return Buffer.concat([index, pixels]);
  },
};
