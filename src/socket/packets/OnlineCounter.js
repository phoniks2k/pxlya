/*
 *
 * Numbers of online players per canvas
 *
 */

const OP_CODE = 0xA7;

export default {
  OP_CODE,
  // CLIENT (receiver)
  /*
   * {
   *   total: totalOnline,
   *   canvasId: online,
   *   ....
   * }
   */
  hydrate(data) {
    const online = {};
    online.total = data.getUint16(1);
    let off = data.byteLength;
    while (off > 3) {
      const onlineUsers = data.getUint16(off -= 2);
      const canvas = data.getUint8(off -= 1);
      online[canvas] = onlineUsers;
    }
    return online;
  },

  dehydrate(online) {
    // SERVER (sender)
    if (!process.env.BROWSER) {
      const canvasIds = Object.keys(online);

      const buffer = Buffer.allocUnsafe(3 + canvasIds.length * (1 + 2));
      buffer.writeUInt8(OP_CODE, 0);
      buffer.writeUInt16BE(online.total, 1);
      let cnt = 1;
      for (let p = 0; p < canvasIds.length; p += 1) {
        const canvasId = canvasIds[p];
        const onlineUsers = online[canvasId];
        buffer.writeUInt8(Number(canvasId), cnt += 2);
        buffer.writeUInt16BE(onlineUsers, cnt += 1);
      }

      return buffer;
    }
    return 0;
  },
};
