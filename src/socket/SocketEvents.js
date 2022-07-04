/*
 * Events for WebSockets
 */
import EventEmitter from 'events';

import OnlineCounter from './packets/OnlineCounter';
import PixelUpdate from './packets/PixelUpdateServer';


class SocketEvents extends EventEmitter {
  constructor() {
    super();
    /*
     * {
     *   total: totalUsersOnline,
     *  canvasId: onlineUsers,
     *  ...
     *  }
     */
    this.onlineCounter = {
      total: 0,
    };
  }

  /*
   * async event
   */
  onAsync(evtString, cb) {
    this.on(evtString, (...args) => {
      setImmediate(() => {
        cb(...args);
      });
    });
  }

  /*
   * broadcast message via websocket
   * @param message Buffer Message to send
   */
  broadcast(message) {
    this.emit('broadcast', message);
  }

  /*
   * broadcast pixel message via websocket
   * @param canvasId number ident of canvas
   * @param chunkid number id consisting of i,j chunk coordinates
   * @param pxls buffer with offset and color of one or more pixels
   */
  broadcastPixels(
    canvasId,
    chunkId,
    pixels,
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
    user,
    message,
    channelId,
  ) {
    this.emit('recvChatMessage', user, message, channelId);
  }

  /*
   * broadcast chat message to all users in channel
   * @param name chatname
   * @param message Message to send
   * @param sendapi If chat message should get boradcasted to api websockets
   *                (usefull if the api is supposed to not answer to its own messages)
   */
  broadcastChatMessage(
    name,
    message,
    channelId,
    id,
    country = 'xx',
    sendapi = true,
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
   * send chat message to a single user in channel
   */
  broadcastSUChatMessage(
    targetUserId,
    name,
    message,
    channelId,
    id,
    country = 'xx',
  ) {
    this.emit(
      'suChatMessage',
      targetUserId,
      name,
      message,
      channelId,
      id,
      country || 'xx',
    );
  }

  /*
   * broadcast Assigning chat channel to user
   * @param userId numerical id of user
   * @param channelId numerical id of chat channel
   * @param channelArray array with channel info [name, type, lastTs]
   */
  broadcastAddChatChannel(
    userId,
    channelId,
    channelArray,
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
    userId,
    channelId,
  ) {
    this.emit('remChatChannel', userId, channelId);
  }

  /*
   * reload user on websocket to get changes
   */
  reloadUser(name) {
    this.emit('reloadUser', name);
  }

  /*
   * broadcast online counter
   * @param online Object of total and canvas online users
   *   (see this.onlineCounter)
   */
  broadcastOnlineCounter(online) {
    this.onlineCounter = online;
    const buffer = OnlineCounter.dehydrate(online);
    this.emit('onlineCounter', buffer);
  }
}

export default new SocketEvents();
