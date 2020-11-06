/* @flow */
import Sequelize from 'sequelize';

import logger from './logger';
import redis from '../data/redis';
import User from '../data/models/User';
import webSockets from '../socket/websockets';
import { Channel, RegUser } from '../data/models';
import ChatMessageBuffer from './ChatMessageBuffer';

import { CHAT_CHANNELS, EVENT_USER_NAME, INFO_USER_NAME } from './constants';

export class ChatProvider {
  constructor() {
    this.defaultChannels = [];
    this.defaultChannelIds = [];
    this.enChannelId = 0;
    this.intChannelId = 0;
    this.infoUserId = 1;
    this.eventUserId = 1;
    this.caseCheck = /^[A-Z !.]*$/;
    this.cyrillic = new RegExp('[\u0436-\u043B]');
    this.filters = [
      {
        regexp: /ADMIN/gi,
        matches: 4,
      },
      {
        regexp: /ADMlN/gi,
        matches: 4,
      },
      {
        regexp: /ADMlN/gi,
        matches: 4,
      },
      {
        regexp: /FUCK/gi,
        matches: 4,
      },
    ];
    this.substitutes = [
      {
        regexp: /http[s]?:\/\/(old.)?pixelplanet\.fun\/#/g,
        replace: '#',
      },
    ];
    this.mutedCountries = [];
    this.chatMessageBuffer = new ChatMessageBuffer();
  }

  async initialize() {
    // find or create default channels
    this.defaultChannels.length = 0;
    this.defaultChannelIds.length = 0;
    for (let i = 0; i < CHAT_CHANNELS.length; i += 1) {
      const { name } = CHAT_CHANNELS[i];
      // eslint-disable-next-line no-await-in-loop
      const channel = await Channel.findOrCreate({
        attributes: [
          'id',
          'lastMessage',
        ],
        where: { name },
        defaults: {
          name,
          lastMessage: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        raw: true,
      });
      const { id } = channel[0];
      if (name === 'int') {
        this.intChannelId = id;
      }
      if (name === 'en') {
        this.enChannelId = id;
      }
      this.defaultChannels.push([
        id,
        name,
      ]);
      this.defaultChannelIds.push(id);
    }
    // find or create default users
    let name = INFO_USER_NAME;
    const infoUser = await RegUser.findOrCreate({
      attributes: [
        'id',
      ],
      where: { name },
      defaults: {
        name,
        verified: 3,
        email: 'info@example.com',
      },
      raw: true,
    });
    this.infoUserId = infoUser[0].id;
    name = EVENT_USER_NAME;
    const eventUser = await RegUser.findOrCreate({
      attributes: [
        'id',
      ],
      where: { name },
      defaults: {
        name,
        verified: 3,
        email: 'event@example.com',
      },
      raw: true,
    });
    this.eventUserId = eventUser[0].id;
  }

  userHasChannelAccess(user, cid, write = false) {
    if (this.defaultChannelIds.includes(cid)) {
      if (!write || user.regUser) {
        return true;
      }
    } else if (user.regUser && user.channelIds.includes(cid)) {
      return true;
    }
    return false;
  }

  getHistory(cid, limit = 30) {
    return this.chatMessageBuffer.getMessages(cid, limit);
  }

  async sendMessage(user, message, channelId: number = 0) {
    const { id } = user;
    const name = user.getName();
    if (!name || !id) {
      // eslint-disable-next-line max-len
      return 'Couldn\'t send your message, pls log out and back in again.';
    }

    if (!this.userHasChannelAccess(user, channelId)) {
      return 'You don\'t have access to this channel';
    }

    const country = user.regUser.flag || 'xx';
    let displayCountry = (name.endsWith('berg') || name.endsWith('stein'))
      ? 'il'
      : country;

    if (!user.regUser.verified) {
      return 'Your mail has to be verified in order to chat';
    }
    if (name === 'Aquila') {
      displayCountry = 'ug';
    }

    if (message.length > 2
      && message === message.toUpperCase()
      && message !== message.toLowerCase()
    ) {
      return 'Stop shouting';
    }

    const muted = await ChatProvider.checkIfMuted(user);
    if (muted === -1) {
      return 'You are permanently muted, join our guilded to apppeal the mute';
    }
    if (muted > 0) {
      if (muted > 120) {
        const timeMin = Math.round(muted / 60);
        return `You are muted for another ${timeMin} minutes`;
      }
      return `You are muted for another ${muted} seconds`;
    }

    for (let i = 0; i < this.filters.length; i += 1) {
      const filter = this.filters[i];
      const count = (message.match(filter.regexp) || []).length;
      if (count >= filter.matches) {
        this.mute(name, channelId, 30);
        return 'Ow no! Spam protection decided to mute you';
      }
    }

    for (let i = 0; i < this.substitutes.length; i += 1) {
      const subsitute = this.substitutes[i];
      message = message.replace(subsitute.regexp, subsitute.replace);
    }

    if (message.includes('http')) {
      return 'no shitty links pls';
    }

    if (message.length > 200) {
      // eslint-disable-next-line max-len
      return 'You can\'t send a message this long :(';
    }

    if (user.isAdmin() && message.charAt(0) === '/') {
      // admin commands
      const cmdArr = message.split(' ');
      const cmd = cmdArr[0].substr(1);
      const args = cmdArr.slice(1);
      if (cmd === 'mute') {
        const timeMin = Number(args.slice(-1));
        if (Number.isNaN(timeMin)) {
          return this.mute(args.join(' '), channelId);
        }
        return this.mute(
          args.slice(0, -1).join(' '),
          channelId,
          timeMin,
        );
      } if (cmd === 'unmute') {
        return this.unmute(args.join(' '), channelId);
      } if (cmd === 'mutec' && args[0]) {
        const cc = args[0].toLowerCase();
        this.mutedCountries.push(cc);
        this.broadcastChatMessage(
          'info',
          `Country ${cc} has been muted`,
          channelId,
          this.infoUserId,
        );
        return null;
      } if (cmd === 'unmutec' && args[0]) {
        const cc = args[0].toLowerCase();
        if (!this.mutedCountries.includes(cc)) {
          return `Country ${cc} is not muted`;
        }
        this.mutedCountries = this.mutedCountries.filter((c) => c !== cc);
        this.broadcastChatMessage(
          'info',
          `Country ${cc} has been unmuted`,
          channelId,
          this.infoUserId,
        );
        return null;
      }
    }

    if (message.match(this.cyrillic) && channelId === this.enChannelId) {
      return 'Please use int channel';
    }

    if (this.mutedCountries.includes(country)) {
      return 'Your country is temporary muted from chat';
    }

    this.broadcastChatMessage(
      name,
      message,
      channelId,
      id,
      displayCountry,
    );
    return null;
  }

  broadcastChatMessage(
    name,
    message,
    channelId,
    id,
    country: string = 'xx',
    sendapi: boolean = true,
  ) {
    if (message.length > 250) {
      return;
    }
    this.chatMessageBuffer.addMessage(
      name,
      message,
      channelId,
      id,
      country,
    );
    webSockets.broadcastChatMessage(
      name,
      message,
      channelId,
      id,
      country,
      sendapi,
    );
  }

  automute(name, channelId) {
    this.mute(name, channelId, 60);
    this.broadcastChatMessage(
      'info',
      `${name} has been muted for spam for 60min`,
      channelId,
      this.infoUserId,
    );
  }

  static async checkIfMuted(user) {
    const key = `mute:${user.id}`;
    const ttl: number = await redis.ttlAsync(key);
    return ttl;
  }

  async mute(plainName, channelId, timeMin = null) {
    const name = (plainName.startsWith('@')) ? plainName.substr(1) : plainName;
    const id = await User.name2Id(name);
    if (!id) {
      return `Couldn't find user ${name}`;
    }
    const key = `mute:${id}`;
    if (timeMin) {
      const ttl = timeMin * 60;
      await redis.setAsync(key, '', 'EX', ttl);
      if (timeMin !== 600 && timeMin !== 60) {
        this.broadcastChatMessage(
          'info',
          `${name} has been muted for ${timeMin}min`,
          channelId,
          this.infoUserId,
        );
      }
    } else {
      await redis.setAsync(key, '');
      this.broadcastChatMessage(
        'info',
        `${name} has been muted forever`,
        channelId,
        this.infoUserId,
      );
    }
    logger.info(`Muted user ${id}`);
    return null;
  }

  async unmute(plainName, channelId) {
    const name = (plainName.startsWith('@')) ? plainName.substr(1) : plainName;
    const id = await User.name2Id(name);
    if (!id) {
      return `Couldn't find user ${name}`;
    }
    const key = `mute:${id}`;
    const delKeys = await redis.delAsync(key);
    if (delKeys !== 1) {
      return `User ${name} is not muted`;
    }
    this.broadcastChatMessage(
      'info',
      `${name} has been unmuted`,
      channelId,
      this.infoUserId,
    );
    logger.info(`Unmuted user ${id}`);
    return null;
  }
}

const chatProvider = new ChatProvider();
export default chatProvider;
