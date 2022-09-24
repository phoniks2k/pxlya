/*
 * timers and cron for account related actions
 */

import { populateRanking } from '../data/sql/RegUser';
import {
  getRanks,
  resetDailyRanks,
  getPrevTop,
  getOnlineUserStats,
  storeOnlinUserAmount,
  getCountryDailyHistory,
  getTopDailyHistory,
} from '../data/redis/ranks';
import socketEvents from '../socket/socketEvents';
import logger from './logger';

import { MINUTE } from './constants';
import { DailyCron, HourlyCron } from '../utils/cron';

class Ranks {
  constructor() {
    this.ranks = {
      dailyRanking: [],
      ranking: [],
      prevTop: [],
      onlineStats: [],
      cHistStats: [],
      histStats: [],
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
    try {
      let someRanks = await Ranks.dailyUpdateRanking();
      this.ranks = {
        ...this.ranks,
        ...someRanks,
      };
      someRanks = await Ranks.hourlyUpdateRanking();
      this.ranks = {
        ...this.ranks,
        ...someRanks,
      };
      await Ranks.updateRanking();
    } catch (err) {
      console.error(`Error initialize ranks: ${err.message}`);
    }
    setInterval(Ranks.updateRanking, 5 * MINUTE);
    DailyCron.hook(Ranks.setDailyRanking);
    setInterval(Ranks.setHourlyRanking, 5 * MINUTE);
    //HourlyCron.hook(Ranks.setHourlyRanking);
  }

  /*
   * get daily and total ranking from database
   */
  static async updateRanking() {
    // only main shard does it
    if (!socketEvents.amIImportant()) {
      return null;
    }
    const ranking = await populateRanking(
      await getRanks(
        false,
        1,
        100,
      ));
    const dailyRanking = await populateRanking(
      await getRanks(
        true,
        1,
        100,
      ));
    const ret = {
      ranking,
      dailyRanking,
    };
    socketEvents.rankingListUpdate(ret);
    return ret;
  }

  /*
   * get online counter stats,
   * list of users online per hour
   */
  static async hourlyUpdateRanking() {
    const onlineStats = await getOnlineUserStats();
    const cHistStats = await getCountryDailyHistory();
    const histStats = await getTopDailyHistory();
    const ret = {
      onlineStats,
      cHistStats,
      histStats,
    };
    if (socketEvents.amIImportant()) {
      // only main shard sends to others
      socketEvents.rankingListUpdate(ret);
    }
    return ret;
  }

  /*
   * get prevTop from database
   */
  static async dailyUpdateRanking() {
    const prevTop = await populateRanking(
      await getPrevTop(),
    );
    const ret = {
      prevTop,
    };
    if (socketEvents.amIImportant()) {
      // only main shard sends to others
      socketEvents.rankingListUpdate(ret);
    }
    return ret;
  }

  /*
   * get and store amount of online users into stats
   */
  static async setHourlyRanking() {
    if (!socketEvents.amIImportant()) {
      return;
    }
    let amount;
    try {
      amount = socketEvents.onlineCounter.total;
      await storeOnlinUserAmount(amount);
      await Ranks.hourlyUpdateRanking();
    } catch (err) {
      console.error(`error on hourly ranking: ${err.message} / ${amount}`);
    }
  }

  /*
   * reset daily rankings, store previous rankings
   */
  static async setDailyRanking() {
    if (!socketEvents.amIImportant()) {
      return;
    }
    logger.info('Resetting Daily Ranking');
    await resetDailyRanks();
    await Ranks.dailyUpdateRanking();
  }
}


const rankings = new Ranks();
export default rankings;
