/*
 * class for chat communications
 */
import { Op } from 'sequelize';
import logger from './logger';
import redis from '../data/redis/client';
import RateLimiter from '../utils/RateLimiter';
import {
  Channel, RegUser, UserChannel, Message,
} from '../data/sql';
import { findIdByNameOrId } from '../data/sql/RegUser';
import ChatMessageBuffer from './ChatMessageBuffer';
import socketEvents from '../socket/SocketEvents';
import checkIPAllowed from './isAllowed';
import { DailyCron } from '../utils/cron';
import { escapeMd } from './utils';
import ttags from './ttag';

import { USE_MAILER } from './config';
import {
  CHAT_CHANNELS,
  EVENT_USER_NAME,
  INFO_USER_NAME,
  APISOCKET_USER_NAME,
} from './constants';

function getUserFromMd(mdUserLink) {
  let mdUser = mdUserLink.trim();
  if (mdUser[0] === '@') {
    mdUser = mdUser.substring(1);
    if (mdUser[0] === '[' && mdUser[mdUser.length - 1] === ')') {
      // if mdUser ping, select Id
      mdUser = mdUser.substring(
        mdUser.lastIndexOf('(') + 1, mdUser.length - 1,
      ).trim();
    }
  }
  return mdUser;
}

export class ChatProvider {
  constructor() {
    this.defaultChannels = {};
    this.langChannels = {};
    this.publicChannelIds = [];
    this.enChannelId = 0;
    this.infoUserId = 1;
    this.eventUserId = 1;
    this.apiSocketUserId = 1;
    this.caseCheck = /^[A-Z !.]*$/;
    this.cyrillic = /[\u0436-\u043B]'/;
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
    this.clearOldMessages = this.clearOldMessages.bind(this);

    socketEvents.on('recvChatMessage', async (user, message, channelId) => {
      const errorMsg = await this.sendMessage(user, message, channelId);
      if (errorMsg) {
        socketEvents.broadcastSUChatMessage(
          user.id,
          'info',
          errorMsg,
          channelId,
          this.infoUserId,
          'il',
        );
      }
    });
  }

  async clearOldMessages() {
    const ids = Object.keys(this.defaultChannels);
    for (let i = 0; i < ids.length; i += 1) {
      const cid = ids[i];
      Message.destroy({
        where: {
          cid,
          createdAt: {
            [Op.lt]: new Date(new Date() - 10 * 24 * 3600 * 1000),
          },
        },
      });
    }
  }

  async initialize() {
    // find or create default channels
    for (let i = 0; i < CHAT_CHANNELS.length; i += 1) {
      const { name } = CHAT_CHANNELS[i];
      // eslint-disable-next-line no-await-in-loop
      const channel = await Channel.findOrCreate({
        where: { name },
        defaults: {
          name,
        },
      });
      const { id, type, lastTs } = channel[0];
      if (name === 'en') {
        this.enChannelId = id;
      }
      this.defaultChannels[id] = [
        name,
        type,
        lastTs,
      ];
      this.publicChannelIds.push(id);
    }
    // find or create non-english lang channels
    const langs = Object.keys(ttags);
    for (let i = 0; i < langs.length; i += 1) {
      const name = langs[i];
      if (name === 'default') {
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const channel = await Channel.findOrCreate({
        where: { name },
        defaults: {
          name,
        },
      });
      const { id, type, lastTs } = channel[0];
      this.langChannels[name] = {
        id,
        type,
        lastTs,
      };
      this.publicChannelIds.push(id);
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
    name = APISOCKET_USER_NAME;
    const apiSocketUser = await RegUser.findOrCreate({
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
    this.apiSocketUserId = apiSocketUser[0].id;
    this.clearOldMessages();
    DailyCron.hook(this.clearOldMessages);
  }

  getDefaultChannels(lang) {
    const langChannel = {};
    if (lang && lang !== 'default') {
      const { langChannels } = this;
      if (langChannels[lang]) {
        const {
          id, type, lastTs,
        } = langChannels[lang];
        langChannel[id] = [lang, type, lastTs];
      }
    }
    return {
      ...langChannel,
      ...this.defaultChannels,
    };
  }

  static async addUserToChannel(
    userId,
    channelId,
    channelArray,
  ) {
    const [, created] = await UserChannel.findOrCreate({
      where: {
        UserId: userId,
        ChannelId: channelId,
      },
      raw: true,
    });

    if (created) {
      socketEvents.broadcastAddChatChannel(
        userId,
        channelId,
        channelArray,
      );
    }
  }

  /*
   * user.lang has to be set
   * this is just the case in chathistory.js and SocketServer
   */
  userHasChannelAccess(user, cid) {
    if (this.defaultChannels[cid]) {
      return true;
    }
    if (user.channels[cid]) {
      return true;
    }
    const { lang } = user;
    if (this.langChannels[lang]
      && this.langChannels[lang].id === cid) {
      return true;
    }
    return false;
  }

  checkIfDm(user, cid) {
    if (this.defaultChannels[cid]) {
      return null;
    }
    const channelArray = user.channels[cid];
    if (channelArray && channelArray.length === 4) {
      return user.channels[cid][3];
    }
    return null;
  }

  getHistory(cid, limit = 30) {
    return this.chatMessageBuffer.getMessages(cid, limit);
  }

  adminCommands(message, channelId, user) {
    // admin commands
    const cmdArr = message.split(' ');
    const cmd = cmdArr[0].substring(1);
    const args = cmdArr.slice(1);
    const initiator = `@[${escapeMd(user.getName())}](${user.id})`;
    switch (cmd) {
      case 'mute': {
        const timeMin = Number(args.slice(-1));
        if (args.length < 2 || Number.isNaN(timeMin)) {
          return this.mute(
            getUserFromMd(args.join(' ')),
            {
              printChannel: channelId,
              initiator,
            },
          );
        }
        return this.mute(
          getUserFromMd(args.slice(0, -1).join(' ')),
          {
            printChannel: channelId,
            initiator,
            duration: timeMin,
          },
        );
      }

      case 'unmute':
        return this.unmute(
          getUserFromMd(args.join(' ')),
          {
            printChannel: channelId,
            initiator,
          },
        );

      case 'mutec': {
        if (args[0]) {
          const cc = args[0].toLowerCase();
          if (cc.length > 3) {
            return 'No legit country defined';
          }
          this.mutedCountries.push(cc);
          this.broadcastChatMessage(
            'info',
            `Country ${cc} has been muted from en by ${initiator}`,
            channelId,
            this.infoUserId,
          );
          return null;
        }
        return 'No country defined for mutec';
      }

      case 'unmutec': {
        if (args[0]) {
          const cc = args[0].toLowerCase();
          if (!this.mutedCountries.includes(cc)) {
            return `Country ${cc} is not muted`;
          }
          this.mutedCountries = this.mutedCountries.filter((c) => c !== cc);
          this.broadcastChatMessage(
            'info',
            `Country ${cc} has been unmuted from en by ${initiator}`,
            channelId,
            this.infoUserId,
          );
          return null;
        }
        if (this.mutedCountries.length) {
          this.broadcastChatMessage(
            'info',
            `Countries ${this.mutedCountries} unmuted from en by ${initiator}`,
            channelId,
            this.infoUserId,
          );
          this.mutedCountries = [];
          return null;
        }
        return 'No country is currently muted';
      }

      default:
        return `Couln't parse command ${cmd}`;
    }
  }

  /*
   * User.ttag for translation has to be set, this is just the case
   * in SocketServer for websocket connections
   * @param user User object
   * @param message string of message
   * @param channelId integer of channel
   * @return error message if unsuccessful, otherwise null
   */
  async sendMessage(
    user,
    message,
    channelId,
  ) {
    const { id } = user;
    const { t } = user.ttag;
    const name = user.getName();

    if (!name || !id) {
      return null;
    }

    const allowed = await checkIPAllowed(user.ip);
    if (!allowed.allowed) {
      logger.info(
        `${name} / ${user.ip} tried to send chat message but is not allowed`,
      );
      switch (allowed.status) {
        case 1:
          return t`You can not send chat messages with proxy`;
        case 2:
          return t`You are banned`;
        case 3:
          return t`Your Internet Provider is banned`;
        default:
          return t`You are not allowed to use chat`;
      }
    }

    if (message.charAt(0) === '/' && user.userlvl) {
      return this.adminCommands(message, channelId, user);
    }

    if (!user.rateLimiter) {
      user.rateLimiter = new RateLimiter(20, 15, true);
    }
    const waitLeft = user.rateLimiter.tick();
    if (waitLeft) {
      const waitTime = Math.floor(waitLeft / 1000);
      // eslint-disable-next-line max-len
      return t`You are sending messages too fast, you have to wait ${waitTime}s :(`;
    }

    if (!this.userHasChannelAccess(user, channelId)) {
      return t`You don\'t have access to this channel`;
    }

    const country = user.regUser.flag || 'xx';
    let displayCountry = countr;
    if (name.endsWith('berg') || name.endsWith('stein')) {
      displayCountry = 'il';
    } else if (user.userlvl !== 0) {
      displayCountry = 'fa';
    } else if (user.id === 2927) {
      /*
       * hard coded flag for Manchukuo_1940
       * TODO make it possible to modify user flags
       */
      displayCountry = 'bt';
    }

    if (USE_MAILER && !user.regUser.verified) {
      return t`Your mail has to be verified in order to chat`;
    }

    const muted = await ChatProvider.checkIfMuted(user.id);
    if (muted === -1) {
      return t`You are permanently muted, join our guilded to apppeal the mute`;
    }
    if (muted > 0) {
      if (muted > 120) {
        const timeMin = Math.round(muted / 60);
        return t`You are muted for another ${timeMin} minutes`;
      }
      return t`You are muted for another ${muted} seconds`;
    }

    for (let i = 0; i < this.filters.length; i += 1) {
      const filter = this.filters[i];
      const count = (message.match(filter.regexp) || []).length;
      if (count >= filter.matches) {
        this.mute(name, { duration: 30, printChannel: channelId });
        return t`Ow no! Spam protection decided to mute you`;
      }
    }

    for (let i = 0; i < this.substitutes.length; i += 1) {
      const subsitute = this.substitutes[i];
      message = message.replace(subsitute.regexp, subsitute.replace);
    }

    if (message.length > 200) {
      // eslint-disable-next-line max-len
      return t`You can\'t send a message this long :(`;
    }

    if (message.match(this.cyrillic) && channelId === this.enChannelId) {
      return t`Please use int channel`;
    }

    if (channelId === this.enChannelId
      && this.mutedCountries.includes(country)
    ) {
      return t`Your country is temporary muted from this chat channel`;
    }

    if (user.last_message && user.last_message === message) {
      user.message_repeat += 1;
      if (user.message_repeat >= 4) {
        this.mute(name, { duration: 60, printChannel: channelId });
        user.message_repeat = 0;
        return t`Stop flooding.`;
      }
    } else {
      user.message_repeat = 0;
      user.last_message = message;
    }

    logger.info(
      `Received chat message ${message} from ${name} / ${user.ip}`,
    );
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
    country = 'xx',
    sendapi = true,
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
    socketEvents.broadcastChatMessage(
      name,
      message,
      channelId,
      id,
      country,
      sendapi,
    );
  }

  static async checkIfMuted(uid) {
    const key = `mute:${uid}`;
    const ttl = await redis.ttl(key);
    return ttl;
  }

  async mute(nameOrId, opts) {
    const timeMin = opts.duration || null;
    const initiator = opts.initiator || null;
    const printChannel = opts.printChannel || null;

    const searchResult = await findIdByNameOrId(nameOrId);
    if (!searchResult) {
      return `Couldn't find user ${nameOrId}`;
    }
    const { name, id } = searchResult;
    const userPing = `@[${escapeMd(name)}](${id})`;

    const key = `mute:${id}`;
    if (timeMin) {
      const ttl = timeMin * 60;
      await redis.set(key, '', {
        EX: ttl,
      });
      if (printChannel) {
        this.broadcastChatMessage(
          'info',
          (initiator)
            ? `${userPing} has been muted for ${timeMin}min by ${initiator}`
            : `${userPing} has been muted for ${timeMin}min`,
          printChannel,
          this.infoUserId,
        );
      }
    } else {
      await redis.set(key, '');
      if (printChannel) {
        this.broadcastChatMessage(
          'info',
          (initiator)
            ? `${userPing} has been muted forever by ${initiator}`
            : `${userPing} has been muted forever`,
          printChannel,
          this.infoUserId,
        );
      }
    }
    logger.info(`Muted user ${userPing}`);
    return null;
  }

  async unmute(nameOrId, opts) {
    const initiator = opts.initiator || null;
    const printChannel = opts.printChannel || null;

    const searchResult = await findIdByNameOrId(nameOrId);
    if (!searchResult) {
      return `Couldn't find user ${nameOrId}`;
    }
    const { name, id } = searchResult;
    const userPing = `@[${escapeMd(name)}](${id})`;

    const key = `mute:${id}`;
    const delKeys = await redis.del(key);
    if (delKeys !== 1) {
      return `User ${userPing} is not muted`;
    }
    if (printChannel) {
      this.broadcastChatMessage(
        'info',
        (initiator)
          ? `${userPing} has been unmuted by ${initiator}`
          : `${userPing} has been unmuted`,
        printChannel,
        this.infoUserId,
      );
    }
    logger.info(`Unmuted user ${userPing}`);
    return null;
  }
}

export default new ChatProvider();
