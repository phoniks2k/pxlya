const OP_CODE = 0xA2;

export default {
  OP_CODE,
  hydrate(data) {
    // SERVER (Receiver)
    const i = data[1] << 8 | data[2];
    return i;
  },
  dehydrate(chunkid) {
    // CLIENT (Sender)
    const buffer = new ArrayBuffer(1 + 2);
    const view = new DataView(buffer);
    view.setInt8(0, OP_CODE);
    view.setInt16(1, chunkid);
    return buffer;
  },
};
