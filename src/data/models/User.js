/**
 *
 * user class which will be set for every single playing user,
 * loged in or not.
 * If user is not logged in, id = null
 *
 * @flow
 * */

import Sequelize from 'sequelize';
import redis from '../redis';
import logger from '../../core/logger';

import Model from '../sequelize';
import RegUser from './RegUser';
import { getIPv6Subnet } from '../../utils/ip';
import { ADMIN_IDS } from '../../core/config';


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

  constructor(id: string = null, ip: string = '127.0.0.1') {
    // id should stay null if unregistered
    this.id = id;
    this.ip = ip;
    this.channels = {};
    this.blocked = [];
    this.userlvl = 0;
    this.ipSub = getIPv6Subnet(ip);
    this.wait = null;
    // following gets populated by passport
    this.regUser = null;
  }

  static async name2Id(name: string) {
    try {
      const userq = await Model.query('SELECT id FROM Users WHERE name = $1',
        {
          bind: [name],
          type: Sequelize.QueryTypes.SELECT,
          raw: true,
          plain: true,
        });
      return userq.id;
    } catch {
      return null;
    }
  }

  setRegUser(reguser) {
    this.regUser = reguser;
    this.id = reguser.id;

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

  addChannel(cid, channelArray) {
    this.channels[cid] = channelArray;
  }

  removeChannel(cid) {
    delete this.channels[cid];
  }

  getName() {
    return (this.regUser) ? this.regUser.name : null;
  }

  async setWait(coolDown: number, canvasId: number): Promise<boolean> {
    if (!coolDown) return false;
    this.wait = Date.now() + coolDown;
    // PX is milliseconds expire
    await redis.setAsync(`cd:${canvasId}:ip:${this.ipSub}`, '', 'PX', coolDown);
    if (this.id != null) {
      await redis.setAsync(`cd:${canvasId}:id:${this.id}`, '', 'PX', coolDown);
    }
    return true;
  }

  async getWait(canvasId: number): Promise<?number> {
    let ttl: number = await redis.pttlAsync(`cd:${canvasId}:ip:${this.ipSub}`);
    if (this.id != null) {
      const ttlid: number = await redis.pttlAsync(
        `cd:${canvasId}:id:${this.id}`,
      );
      ttl = Math.max(ttl, ttlid);
    }
    logger.debug('ererer', ttl, typeof ttl);


    const wait = ttl < 0 ? null : Date.now() + ttl;
    this.wait = wait;
    return wait;
  }

  async incrementPixelcount(): Promise<boolean> {
    const { id } = this;
    if (!id) return false;
    if (this.userlvl === 1) return false;
    try {
      await RegUser.update({
        totalPixels: Sequelize.literal('totalPixels + 1'),
        dailyTotalPixels: Sequelize.literal('dailyTotalPixels + 1'),
      }, {
        where: { id },
      });
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
      const userq = await Model.query(
        'SELECT totalPixels FROM Users WHERE id = $1',
        {
          bind: [id],
          type: Sequelize.QueryTypes.SELECT,
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
        lastLogIn: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    } catch (err) {
      return false;
    }
    return true;
  }

  getUserData(): Object {
    if (this.regUser == null) {
      return {
        name: null,
        mailVerified: false,
        mcVerified: false,
        minecraftname: null,
        blockDm: false,
        totalPixels: 0,
        dailyTotalPixels: 0,
        ranking: null,
        dailyRanking: null,
        mailreg: false,
        userlvl: 0,
        channels: this.channels,
        blocked: this.blocked,
      };
    }
    const {
      regUser, userlvl, channels, blocked,
    } = this;
    return {
      name: regUser.name,
      mailVerified: regUser.mailVerified,
      mcVerified: regUser.mcVerified,
      minecraftname: regUser.minecraftname,
      blockDm: regUser.blockDm,
      totalPixels: regUser.totalPixels,
      dailyTotalPixels: regUser.dailyTotalPixels,
      ranking: regUser.ranking,
      dailyRanking: regUser.dailyRanking,
      mailreg: !!(regUser.password),
      userlvl,
      channels,
      blocked,
    };
  }
}

export default User;
