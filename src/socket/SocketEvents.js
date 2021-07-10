/* @flow
 *
 * Events for WebSockets
 */
import EventEmitter from 'events';

import OnlineCounter from './packets/OnlineCounter';
import PixelUpdate from './packets/PixelUpdateServer';


class SocketEvents extends EventEmitter {
  constructor() {
    super();
    this.onlineCounter = 0;
  }

  /*
   * broadcast message via websocket
   * @param message Message to send
   */
  broadcast(message: Buffer) {
    this.emit('broadcast', message);
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
    this.emit('pixelUpdate', canvasId, chunkId, buffer);
  }

  /*
   * received Chat message on own websocket
   * @param user User Instance that sent the message
   * @param message text message
   * @param channelId numerical channel id
   */
  recvChatMessage(
    user: Object,
    message: string,
    channelId: number,
  ) {
    this.emit('recvChatMessage', user, message, channelId);
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
    this.emit(
      'chatMessage',
      name,
      message,
      channelId,
      id,
      country || 'xx',
      sendapi,
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
    this.emit(
      'addChatChannel',
      userId,
      channelId,
      channelArray,
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
    this.emit('remChatChannel', userId, channelId);
  }

  /*
   * reload user on websocket to get changes
   */
  reloadUser(name: string) {
    this.emit('reloadUser', name);
  }

  /*
   * broadcast online counter
   * @param online Number of users online
   */
  broadcastOnlineCounter(online: number) {
    this.onlineCounter = online;
    const buffer = OnlineCounter.dehydrate({ online });
    this.emit('broadcast', buffer);
  }
}

export default new SocketEvents();
