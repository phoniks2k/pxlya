/* @flow
 *
 * Serverside communication with websockets.
 * In general all values that get broadcasted here have to be sanitized already.
 *
 */

import OnlineCounter from './packets/OnlineCounter';
import PixelUpdate from './packets/PixelUpdateServer';


class WebSockets {
  listeners: Array<Object>;
  onlineCounter: number;

  constructor() {
    this.listeners = [];
    this.onlineCounter = 0;
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  remListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /*
   * broadcast message via websocket
   * @param message Message to send
   */
  broadcast(message: Buffer) {
    this.listeners.forEach(
      (listener) => listener.broadcast(message),
    );
  }

  /*
   * broadcast pixel message via websocket
   * @param canvasId ident of canvas
   * @param chunkid id consisting of i,j chunk coordinates
   * @param pxls buffer with offset and color of one or more pixels
   */
  broadcastPixels(
    canvasId: number,
    chunkId: number,
    pixels: Buffer,
  ) {
    const buffer = PixelUpdate.dehydrate(chunkId, pixels);
    this.listeners.forEach(
      (listener) => listener.broadcastPixelBuffer(canvasId, chunkId, buffer),
    );
  }

  /*
   * broadcast chat message
   * @param name chatname
   * @param message Message to send
   * @param sendapi If chat message should get boradcasted to api websockets
   *                (usefull if the api is supposed to not answer to its own messages)
   */
  broadcastChatMessage(
    name: string,
    message: string,
    channelId: number,
    id: number,
    country: string = 'xx',
    sendapi: boolean = true,
  ) {
    country = country || 'xx';
    this.listeners.forEach(
      (listener) => listener.broadcastChatMessage(
        name,
        message,
        channelId,
        id,
        country,
        sendapi,
      ),
    );
  }

  /*
   * broadcast Assigning chat channel to user
   * @param userId numerical id of user
   * @param channelId numerical id of chat channel
   * @param channelArray array with channel info [name, type, lastTs]
   */
  broadcastAddChatChannel(
    userId: number,
    channelId: number,
    channelArray: Array,
  ) {
    this.listeners.forEach(
      (listener) => listener.broadcastAddChatChannel(
        userId,
        channelId,
        channelArray,
      ),
    );
  }

  /*
   * broadcast Removing chat channel from user
   * @param userId numerical id of user
   * @param channelId numerical id of chat channel
   *        (i.e. false if the user already gets it via api response)
   */
  broadcastRemoveChatChannel(
    userId: number,
    channelId: number,
  ) {
    this.listeners.forEach(
      (listener) => listener.broadcastRemoveChatChannel(
        userId,
        channelId,
      ),
    );
  }

  /*
   * broadcast minecraft linking to API
   * @param name pixelplanetname
   * @param minecraftid minecraftid
   * @param accepted If link request got accepted
   */
  broadcastMinecraftLink(
    name: string,
    minecraftid: string,
    accepted: boolean,
  ) {
    this.listeners.forEach(
      (listener) => listener.broadcastMinecraftLink(
        name,
        minecraftid,
        accepted,
      ),
    );
  }

  /*
   * Notify user on websocket that he should rerequest api/message
   */
  notifyChangedMe(name: string) {
    this.listeners.forEach(
      (listener) => listener.notifyChangedMe(name),
    );
  }

  /*
   * reload user on websocket to get changes
   */
  reloadUser(name: string) {
    this.listeners.forEach(
      (listener) => listener.reloadUser(name),
    );
  }

  /*
   * broadcast mc tp request to API
   * @param minecraftid minecraftid
   * @param x x coords
   * @param y y coords
   */
  broadcastMinecraftTP(minecraftid, x, y) {
    this.listeners.forEach(
      (listener) => listener.broadcastMinecraftTP(minecraftid, x, y),
    );
  }

  /*
   * broadcast online counter
   * @param online Number of users online
   */
  broadcastOnlineCounter(online: number) {
    this.onlineCounter = online;
    const buffer = OnlineCounter.dehydrate({ online });
    this.listeners.forEach(
      (listener) => listener.broadcastOnlineCounter(buffer),
    );
  }
}

const webSockets = new WebSockets();
export default webSockets;
