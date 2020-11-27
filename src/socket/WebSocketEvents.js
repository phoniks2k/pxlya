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

  broadcastMinecraftLink(name: string, minecraftid: string, accepted: boolean) {
  }

  broadcastAddChatChannel(
    userId: number,
    channelId: number,
    channelArray: Array,
    notify: boolean,
  ) {
  }

  broadcastRemoveChatChannel(
    userId: number,
    channelId: number,
    notify: boolean,
  ) {
  }

  notifyChangedMe(name: string) {
  }

  broadcastMinecraftTP(minecraftid: string, x: number, y: number) {
  }

  broadcastOnlineCounter(data: Buffer) {
  }
}

export default WebSocketEvents;
