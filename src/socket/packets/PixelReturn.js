const OP_CODE = 0xC3;

export default {
  OP_CODE,
  hydrate(data) {
    // Client (receiver)
    const retCode = data.getUint8(1);
    const wait = data.getUint32(2);
    const coolDownSeconds = data.getInt16(6);
    const pxlCnt = data.getUint8(8);
    const rankedPxlCnt = data.getUint8(9);
    return [
      retCode,
      wait,
      coolDownSeconds,
      pxlCnt,
      rankedPxlCnt,
    ];
  },
  dehydrate(
    retCode,
    wait = 0,
    coolDown = 0,
    pxlCnt = 0,
    rankedPxlCnt = 0,
  ) {
    // Server (sender)
    const buffer = Buffer.allocUnsafe(1 + 1 + 4 + 2 + 1 + 1);
    buffer.writeUInt8(OP_CODE, 0);
    buffer.writeUInt8(retCode, 1);
    buffer.writeUInt32BE(wait, 2);
    const coolDownSeconds = Math.round(coolDown / 1000);
    buffer.writeInt16BE(coolDownSeconds, 6);
    buffer.writeUInt8(pxlCnt, 8);
    buffer.writeUInt8(rankedPxlCnt, 9);
    return buffer;
  },
};
