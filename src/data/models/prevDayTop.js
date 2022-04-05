/*
 * saving and loading the top 10 of the previous day
 */

import redis from '../redis';
import logger from '../../core/logger';

const PREV_DAILY_TOP_KEY = 'prevtop';

/*
 * saves the top 10 into redis
 * @param dailyRanking Array of dailyRanking
 */
export async function saveDailyTop(dailyRanking) {
  const top10 = dailyRanking.slice(0, 10).map((user) => user.id);
  const jsonTop = JSON.stringify(top10);
  logger.info(`Saving current daily top 10 into redis: ${jsonTop}`);
  await redis.set(PREV_DAILY_TOP_KEY, jsonTop);
  return top10;
}

/*
 * load top10 from redis
 * @return Promis<Array> Array of user IDs of the top 10
 */
export async function loadDailyTop() {
  const jsonTop = await redis.get(PREV_DAILY_TOP_KEY);
  logger.info(`Loaded current daily top 10 into redis: ${jsonTop}`);
  return (jsonTop) ? JSON.parse(jsonTop) : [];
}
