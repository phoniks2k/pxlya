/*
 * timers and cron for account related actions
 */

import Sequelize from 'sequelize';
import RegUser from '../data/sql/RegUser';
import {
  getRanks,
  resetDailyRanks,
  saveDailyTop,
  loadDailyTop,
} from '../data/redis/ranks';
import socketEvents from '../socket/socketEvents';
import logger from './logger';

import { MINUTE } from './constants';
import { DailyCron } from '../utils/cron';

class Ranks {
  ranks; // Array

  constructor() {
    this.updateRanking = this.updateRanking.bind(this);
    this.resetDailyRanking = this.resetDailyRanking.bind(this);
    this.prevTop = [];
    this.ranks = {
      dailyRanking: [],
      ranking: [],
    };
  }

  async initialize() {
    this.prevTop = await loadDailyTop();
    await this.updateRanking();
    setInterval(this.updateRanking, 1 * MINUTE);
    DailyCron.hook(this.resetDailyRanking);
  }

  /*
   * take array of {useId: score} and resolve
   * user informations
   */
  static async populateRanking(rawRanks) {
    if (!rawRanks.length) {
      return rawRanks;
    }
    const uids = rawRanks.map((r) => r.id);
    const userData = await RegUser.findAll({
      attributes: [
        'id',
        'name',
        [
          Sequelize.fn(
            'DATEDIFF',
            Sequelize.literal('CURRENT_TIMESTAMP'),
            Sequelize.col('createdAt'),
          ),
          'age',
        ],
      ],
      where: {
        id: uids,
      },
      raw: true,
    });
    for (let i = 0; i < userData.length; i += 1) {
      const { id, name, age } = userData[i];
      const dat = rawRanks.find((r) => r.id === id);
      if (dat) {
        dat.name = name;
        dat.age = age;
      }
    }
    return rawRanks;
  }

  async updateRanking() {
    if (socketEvents.amIImportant()) {
      // TODO do this only in main shard
    }
    // populate dictionaries
    const ranking = await Ranks.populateRanking(
      await getRanks(
        false,
        1,
        100,
      ));
    const dailyRanking = await Ranks.populateRanking(
      await getRanks(
        true,
        1,
        100,
      ));
    this.ranks.ranking = ranking;
    this.ranks.dailyRanking = dailyRanking;
  }

  async resetDailyRanking() {
    if (!socketEvents.amIImportant()) {
      return;
    }
    this.prevTop = await saveDailyTop(this.ranks.dailyRanking);
    logger.info('Resetting Daily Ranking');
    await resetDailyRanks();
    await this.updateRanking();
  }
}


const rankings = new Ranks();
export default rankings;
