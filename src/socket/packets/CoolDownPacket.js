const OP_CODE = 0xC2;

export default {
  OP_CODE,
  hydrate(data) {
    // client (receiver)
    return data.getUint32(1);
  },
  dehydrate(wait) {
    // Server (sender)
    const buffer = Buffer.allocUnsafe(1 + 4);
    buffer.writeUInt8(OP_CODE, 0);
    buffer.writeUInt32BE(wait, 1);
    return buffer;
  },
};
