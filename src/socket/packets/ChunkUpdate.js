/*
 * notify that chunk changed
 * (not sent over websocket, server only)
 */

const OP_CODE = 0xC4;

export default {
  OP_CODE,
  /*
   * @return canvasId, [i, j]
   */
  hydrate(data) {
    const canvasId = data[1];
    const i = data.readUInt8(2);
    const j = data.readUInt8(3);
    return [canvasId, [i, j]];
  },
  /*
   * @param canvasId,
   * chunkid id consisting of chunk coordinates
   */
  dehydrate(canvasId, [i, j]) {
    return Buffer.from([
      OP_CODE,
      canvasId,
      i,
      j,
    ]);
  },
};
