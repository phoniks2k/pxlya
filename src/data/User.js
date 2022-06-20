/**
 *
 * user class which will be set for every single playing user,
 * loged in or not.
 * If user is not logged in, id = null
 *
 * @flow
 * */

import { QueryTypes, Utils } from 'sequelize';
import redis from './redis/client';
import logger from '../core/logger';

import sequelize from './sql/sequelize';
import { RegUser, Channel, UserBlock } from './sql';
import { getIPv6Subnet } from '../utils/ip';
import { ADMIN_IDS } from '../core/config';


export const regUserQueryInclude = [{
  model: Channel,
  as: 'channel',
  include: [{
    model: RegUser,
    as: 'dmu1',
    foreignKey: 'dmu1id',
    attributes: [
      'id',
      'name',
    ],
  }, {
    model: RegUser,
    as: 'dmu2',
    foreignKey: 'dmu2id',
    attributes: [
      'id',
      'name',
    ],
  }],
}, {
  model: RegUser,
  through: UserBlock,
  as: 'blocked',
  foreignKey: 'uid',
  attributes: [
    'id',
    'name',
  ],
}];

class User {
  id: string;
  ip: string;
  wait: ?number;
  regUser: Object;
  channels: Object;
  blocked: Array;
  /*
   * 0: nothing
   * 1: Admin
   * 2: Mod
   */
  userlvl: number;

  constructor() {
    // if id = null -> unregistered
    this.id = null;
    this.regUser = null;
    this.ip = '127.0.0.1';
    this.ipSub = this.ip;
    this.channels = {};
    this.blocked = [];
    this.userlvl = 0;
  }

  async initialize(id, ip = null, regUser = null) {
    if (ip) {
      this.ip = ip;
      this.ipSub = getIPv6Subnet(ip);
    }
    if (regUser) {
      this.id = regUser.id;
      this.setRegUser(regUser);
    }
    if (id && !regUser) {
      const reguser = await RegUser.findByPk(id, {
        include: regUserQueryInclude,
      });
      if (reguser) {
        this.setRegUser(reguser);
        this.id = id;
      }
    }
  }

  setRegUser(reguser) {
    this.regUser = reguser;
    this.id = reguser.id;
    this.channels = {};
    this.blocked = [];

    if (this.regUser.isMod) {
      this.userlvl = 2;
    }
    if (ADMIN_IDS.includes(this.id)) {
      this.userlvl = 1;
    }

    if (reguser.channel) {
      for (let i = 0; i < reguser.channel.length; i += 1) {
        const {
          id,
          type,
          lastTs,
          dmu1,
          dmu2,
        } = reguser.channel[i];
        if (type === 1) {
          /* in DMs:
           * the name is the name of the other user
           * id also gets grabbed
           *
           * TODO clean DMs of deleted users
           */
          if (!dmu1 || !dmu2) {
            continue;
          }
          const name = (dmu1.id === this.id) ? dmu2.name : dmu1.name;
          const dmu = (dmu1.id === this.id) ? dmu2.id : dmu1.id;
          this.addChannel(id, [
            name,
            type,
            lastTs,
            dmu,
          ]);
        } else {
          const { name } = reguser.channel[i];
          this.addChannel(id, [
            name,
            type,
            lastTs,
          ]);
        }
      }
    }
    if (reguser.blocked) {
      for (let i = 0; i < reguser.blocked.length; i += 1) {
        const {
          id,
          name,
        } = reguser.blocked[i];
        this.blocked.push([id, name]);
      }
    }
  }

  async reload() {
    if (!this.regUser) return;
    await this.regUser.reload();
    this.setRegUser(this.regUser);
  }

  addChannel(cid, channelArray) {
    this.channels[cid] = channelArray;
  }

  removeChannel(cid) {
    delete this.channels[cid];
  }

  getName() {
    return (this.regUser) ? this.regUser.name : null;
  }

  async setWait(wait: number, canvasId: number): Promise<boolean> {
    if (!wait) return false;
    // PX is milliseconds expire
    await redis.set(`cd:${canvasId}:ip:${this.ipSub}`, '', {
      PX: wait,
    });
    if (this.id != null) {
      await redis.set(`cd:${canvasId}:id:${this.id}`, '', {
        PX: wait,
      });
    }
    return true;
  }

  async getWait(canvasId: number): Promise<?number> {
    let ttl = await redis.pTTL(`cd:${canvasId}:ip:${this.ipSub}`);
    if (this.id != null) {
      const ttlid = await redis.pTTL(
        `cd:${canvasId}:id:${this.id}`,
      );
      ttl = Math.max(ttl, ttlid);
    }
    logger.debug('ererer', ttl, typeof ttl);

    const wait = ttl < 0 ? 0 : ttl;
    return wait;
  }

  async incrementPixelcount(amount: number = 1): Promise<boolean> {
    const { id } = this;
    if (!id) return false;
    if (this.userlvl === 1) return false;
    try {
      await this.regUser.increment(
        ['totalPixels', 'dailyTotalPixels'],
        { by: amount },
      );
    } catch (err) {
      return false;
    }
    return true;
  }

  async getTotalPixels(): Promise<number> {
    const { id } = this;
    if (!id) return 0;
    if (this.userlvl === 1) return 100000;
    if (this.regUser) {
      return this.regUser.totalPixels;
    }
    try {
      const userq = await sequelize.query(
        'SELECT totalPixels FROM Users WHERE id = $1',
        {
          bind: [id],
          type: QueryTypes.SELECT,
          raw: true,
          plain: true,
        },
      );
      return userq.totalPixels;
    } catch (err) {
      return 0;
    }
  }

  async setCountry(country) {
    if (this.regUser && this.regUser.flag !== country) {
      this.regUser.update({
        flag: country,
      });
    }
  }

  async updateLogInTimestamp(): Promise<boolean> {
    if (!this.regUser) return false;
    try {
      await this.regUser.update({
        lastLogIn: new Utils.Literal('CURRENT_TIMESTAMP'),
      });
    } catch (err) {
      return false;
    }
    return true;
  }

  getUserData(): Object {
    const {
      id,
      userlvl,
      channels,
      blocked,
    } = this;
    const data = {
      id,
      userlvl,
      channels,
      blocked,
    };
    if (this.regUser == null) {
      return {
        ...data,
        name: null,
        mailVerified: false,
        blockDm: false,
        totalPixels: 0,
        dailyTotalPixels: 0,
        ranking: null,
        dailyRanking: null,
        mailreg: false,
      };
    }
    const { regUser } = this;
    return {
      ...data,
      name: regUser.name,
      mailVerified: regUser.mailVerified,
      blockDm: regUser.blockDm,
      totalPixels: regUser.totalPixels,
      dailyTotalPixels: regUser.dailyTotalPixels,
      ranking: regUser.ranking,
      dailyRanking: regUser.dailyRanking,
      mailreg: !!(regUser.password),
    };
  }
}

export default User;
