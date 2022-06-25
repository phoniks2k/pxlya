const OP_CODE = 0xA6;

export default {
  OP_CODE,

  dehydrate() {
    // Server (sender)
    return new Uint8Array([OP_CODE]).buffer;
  },
};
