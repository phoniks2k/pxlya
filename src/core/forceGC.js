/**
 * https://blog.jayway.com/2015/04/13/600k-concurrent-websocket-connections-on-aws-using-node-js/
 */
function forceGC() {
  if (global.gc) {
    global.gc();
  }
}

export default forceGC;
