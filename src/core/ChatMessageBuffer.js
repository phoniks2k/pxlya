/*
 * Buffer for chatMessages for the server
 * it just buffers the msot recent 200 messages for each channel
 *
 * @flow
 */
import Sequelize from 'sequelize';
import logger from './logger';

import { RegUser, Message, Channel } from '../data/models';

const MAX_BUFFER_TIME = 120000;

class ChatMessageBuffer {
  constructor() {
    this.buffer = new Map();
    this.timestamps = new Map();

    this.cleanBuffer = this.cleanBuffer.bind(this);
    this.cleanLoop = setInterval(this.cleanBuffer, 3 * 60 * 1000);
  }

  async getMessages(cid, limit = 30) {
    if (limit > 200) {
      return ChatMessageBuffer.getMessagesFromDatabase(cid, limit);
    }

    let messages = this.buffer.get(cid);
    if (!messages) {
      messages = await ChatMessageBuffer.getMessagesFromDatabase(cid);
      this.buffer.set(cid, messages);
    }
    this.timestamps.set(cid, Date.now());
    return messages.slice(-limit);
  }

  cleanBuffer() {
    const curTime = Date.now();
    const toDelete = [];
    this.timestamps.forEach((cid, timestamp) => {
      if (curTime > timestamp + MAX_BUFFER_TIME) {
        toDelete.push(cid);
      }
    });
    toDelete.forEach((cid) => {
      this.buffer.delete(cid);
      this.timestamps.delete(cid);
    });
    logger.info(
      `Cleaned ${toDelete.length} channels from chat message buffer`,
    );
  }

  async addMessage(
    name,
    message,
    cid,
    uid,
    flag,
  ) {
    Message.create({
      cid,
      uid,
      message,
    });
    Channel.update({
      lastMessage: Sequelize.literal('CURRENT_TIMESTAMP'),
    }, {
      where: {
        id: cid,
      },
    });
    const messages = this.buffer.get(cid);
    if (messages) {
      messages.push([
        name,
        message,
        flag,
        uid,
      ]);
    }
  }

  static async getMessagesFromDatabase(cid, limit = 200) {
    const messagesModel = await Message.findAll({
      include: [
        {
          model: RegUser,
          as: 'user',
          foreignKey: 'uid',
          attributes: [
            'id',
            'name',
            'flag',
          ],
        },
      ],
      attributes: [
        'message',
      ],
      where: { cid },
      limit,
      order: [['createdAt', 'DESC']],
      raw: true,
    });
    const messages = [];
    let i = messagesModel.length;
    while (i > 0) {
      i -= 1;
      const {
        message,
        'user.name': name,
        'user.flag': flag,
        'user.id': uid,
      } = messagesModel[i];
      messages.push([
        name,
        message,
        flag,
        uid,
      ]);
    }
    return messages;
  }
}

export default ChatMessageBuffer;
