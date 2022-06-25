const OP_CODE = 0xB0;

export default {
  OP_CODE,

  dehydrate() {
    // Client (sender)
    return new Uint8Array([OP_CODE]).buffer;
  },
};
