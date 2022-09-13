/*
 * counter for daily and total pixels and ranking
 */
import client from './client';

import logger from '../../core/logger';

export const RANKED_KEY = 'rank';
export const DAILY_RANKED_KEY = 'rankd';
export const DAILY_CRANKED_KEY = 'crankd';
const PREV_DAY_TOP_KEY = 'prankd';
const DAY_STATS_RANKS_KEY = 'ds';
const CDAY_STATS_RANKS_KEY = 'cds';
const PREV_DAILY_TOP_KEY = 'prevtop';

/*
 * get pixelcount and ranking
 * @param userId
 * @return [ totalPixels, dailyPixels, totalRanking, dailyRanking ]
 */
export async function getUserRanks(userId) {
  const ranks = await client.getUserRanks(
    RANKED_KEY, DAILY_RANKED_KEY,
    userId,
  );
  return ranks.map((r) => Number(r));
}

/*
 * get userIds by ranks
 * @param daily integer if using daily or total score
 * @param start, amount rank to start and end
 * @return Array of objects with {userId, score, dailyScore} in given range
 */
export async function getRanks(daily, start, amount) {
  start -= 1;
  amount -= 1;
  let key;
  let valueName;
  let rankName;
  let oKey;
  let oValueName;
  let oRankName;
  if (daily) {
    key = DAILY_RANKED_KEY;
    valueName = 'dailyTotalPixels';
    rankName = 'dailyRanking';
    oKey = RANKED_KEY;
    oValueName = 'totalPixels';
    oRankName = 'ranking';
  } else {
    key = RANKED_KEY;
    valueName = 'totalPixels';
    rankName = 'ranking';
    oKey = DAILY_RANKED_KEY;
    oValueName = 'dailyTotalPixels';
    oRankName = 'dailyRanking';
  }
  /* returns { value: uid, score: pixelCnt } */
  const ranks = await client.zRangeWithScores(key, start, start + amount, {
    REV: true,
  });
  const uids = ranks.map((r) => r.value);
  if (!uids.length) {
    return uids;
  }
  const oScores = await client.zmScore(oKey, uids);
  /* impolemented with lua, which blocks :( */
  const oRanks = await client.zmRankRev(oKey, uids);
  const ret = [];
  for (let i = 0; i < ranks.length; i += 1) {
    const uob = {
      id: Number(uids[i]),
      [valueName]: ranks[i].score,
      [rankName]: i + 1,
      [oValueName]: oScores[i],
      [oRankName]: oRanks[i] + 1,
    };
    ret.push(uob);
  }
  return ret;
}

/*
 * reset daily ranks
 * @return boolean for success
 */
export async function resetDailyRanks() {
  // store top 10
  console.log('DAILYREDIS SAVE TOP 10');
  await client.zRangeWithScores(PREV_DAY_TOP_KEY, DAILY_RANKED_KEY, 0, 9, {
    REV: true,
    WITHSCORES: true,
  });
  // store day
  const yesterday = new Date(Date.now() - 1000 * 3600 * 24);
  let day = yesterday.getUTCDate();
  if (day < 10) day = `0${day}`;
  let month = yesterday.getUTCMonth() + 1;
  if (month < 10) month = `0${month}`;
  const year = yesterday.getUTCFullYear();
  const dateKey = `${year}${month}${day}`;
  console.log('DAILYREDIS', dateKey);
  await client.zUnionStore(
    `${DAY_STATS_RANKS_KEY}:${dateKey}`,
    DAILY_RANKED_KEY,
  );
  await client.zUnionStore(
    `${CDAY_STATS_RANKS_KEY}:${dateKey}`,
    DAILY_CRANKED_KEY,
  );
  // reset daily counter
  console.log('DAILYREDIS RESET');
  await client.del(DAILY_RANKED_KEY);
  await client.del(DAILY_CRANKED_KEY);
}

/*
 * saves the top 10 into redis
 * @param dailyRanking Array of dailyRanking
 */
export async function saveDailyTop(dailyRanking) {
  const top10 = dailyRanking.slice(0, 10).map((user) => user.id);
  const jsonTop = JSON.stringify(top10);
  logger.info(`Saving current daily top 10 into redis: ${jsonTop}`);
  await client.set(PREV_DAILY_TOP_KEY, jsonTop);
  return top10;
}

/*
 * load top10 from redis
 * @return Promis<Array> Array of user IDs of the top 10
 */
export async function loadDailyTop() {
  const jsonTop = await client.get(PREV_DAILY_TOP_KEY);
  logger.info(`Loaded current daily top 10 into redis: ${jsonTop}`);
  return (jsonTop) ? JSON.parse(jsonTop) : [];
}
