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
  constructor() {
    this.resetDailyRanking = this.resetDailyRanking.bind(this);
    this.ranks = {
      dailyRanking: [],
      ranking: [],
      prevTop: [],
    };
    /*
     * we go through socketEvents for sharding
     */
    socketEvents.on('rankingListUpdate', (rankings) => {
      this.ranks = {
        ...this.ranks,
        ...rankings,
      };
    });
  }

  async initialize() {
    this.ranks.prevTop = await loadDailyTop();
    await Ranks.updateRanking();
    setInterval(Ranks.updateRanking, 5 * MINUTE);
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

  static async updateRanking() {
    /*
     * only main shard updates and sends it to others
     */
    if (!socketEvents.amIImportant()) {
      return;
    }
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
    socketEvents.rankingListUpdate({ ranking, dailyRanking });
  }

  async resetDailyRanking() {
    /*
     * only main shard updates and sends it to others
     */
    if (!socketEvents.amIImportant()) {
      return;
    }
    const prevTop = await saveDailyTop(this.ranks.dailyRanking);
    socketEvents.rankingListUpdate({ prevTop });
    logger.info('Resetting Daily Ranking');
    await resetDailyRanks();
    await Ranks.updateRanking();
  }
}


const rankings = new Ranks();
export default rankings;
