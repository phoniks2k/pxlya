const OP_CODE = 0xA3;

export default {
  OP_CODE,
  /*
   * @param chunks Array of chunks
   */
  dehydrate(chunks) {
    // CLIENT (Sender)
    const buffer = new ArrayBuffer(1 + 1 + chunks.length * 2);
    const view = new Uint16Array(buffer);
    // this will result into a double first byte, but still better than
    // shifting 16bit integers around later
    view[0] = OP_CODE;
    for (let cnt = 0; cnt < chunks.length; cnt += 1) {
      view[cnt + 1] = chunks[cnt];
    }
    return buffer;
  },
};
