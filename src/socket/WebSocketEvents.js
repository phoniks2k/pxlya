/* @flow
 *
 * Parent class for socket servers
 *
 */

/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */

class WebSocketEvents {
  broadcast(message: Buffer) {
  }

  broadcastPixelBuffer(canvasId: number, chunkid: number, buffer: Buffer) {
  }

  broadcastChatMessage(
    name: string,
    message: string,
    channelId: number,
    userId: number,
  ) {}

  broadcastAddChatChannel(
    userId: number,
    channelId: number,
    channelArray: Array,
  ) {
  }

  broadcastRemoveChatChannel(
    userId: number,
    channelId: number,
  ) {
  }

  reloadUser(name: string) {
  }

  broadcastOnlineCounter(data: Buffer) {
  }
}

export default WebSocketEvents;
