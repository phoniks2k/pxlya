/*
 * counter for daily and total pixels and ranking
 */
import client from './client';
import { getDateKeyOfTs } from '../../core/utils';

export const RANKED_KEY = 'rank';
export const DAILY_RANKED_KEY = 'rankd';
export const DAILY_CRANKED_KEY = 'crankd';
const PREV_DAY_TOP_KEY = 'prankd';
const DAY_STATS_RANKS_KEY = 'ds';
const CDAY_STATS_RANKS_KEY = 'cds';
const ONLINE_CNTR_KEY = 'tonl';

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
    valueName = 'dt';
    rankName = 'dr';
    oKey = RANKED_KEY;
    oValueName = 't';
    oRankName = 'r';
  } else {
    key = RANKED_KEY;
    valueName = 't';
    rankName = 'r';
    oKey = DAILY_RANKED_KEY;
    oValueName = 'dt';
    oRankName = 'dr';
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
      [oRankName]: oRanks[i],
    };
    ret.push(uob);
  }
  return ret;
}

/*
 * get daily country ranking
 */
export async function getCountryRanks(start, amount) {
  let ranks = await client.zRangeWithScores(
    DAILY_CRANKED_KEY, start, start + amount, {
      REV: true,
    });
  ranks = ranks.map((r) => ({
    cc: r.value,
    px: Number(r.score),
  }));
  return ranks;
}

/*
 * get top 10 from previous day
 */
export async function getPrevTop() {
  let prevTop = await client.zRangeWithScores(PREV_DAY_TOP_KEY, 0, 9, {
    REV: true,
  });
  prevTop = prevTop.map((r) => ({
    id: Number(r.value),
    px: Number(r.score),
  }));
  return prevTop;
}

/*
 * store amount of online Users
 */
export async function storeOnlinUserAmount(amount) {
  await client.lPush(ONLINE_CNTR_KEY, String(amount));
  await client.lTrim(ONLINE_CNTR_KEY, 0, 14 * 24);
}

/*
 * get list of online counters
 */
export async function getOnlineUserStats() {
  let onlineStats = await client.lRange(ONLINE_CNTR_KEY, 0, -1);
  onlineStats = onlineStats.map((s) => Number(s));
  return onlineStats;
}

/*
 * get top 10 of daily pixels over the past days
 */
export async function getTopDailyHistory() {
  const stats = [];
  const users = [];
  let ts;
  let key;
  for (let c = 0; c < 14; c += 1) {
    if (!ts) {
      ts = Date.now();
      key = DAY_STATS_RANKS_KEY;
    } else {
      ts -= 1000 * 3600 * 24;
      const dateKey = getDateKeyOfTs(ts);
      key = `${DAY_STATS_RANKS_KEY}:${dateKey}`;
    }
    // eslint-disable-next-line no-await-in-loop
    let dData = await client.zRangeWithScores(key, 0, 9, {
      REV: true,
    });
    dData = dData.map((r) => {
      const id = Number(r.value);
      if (!users.some((q) => q.id === id)) {
        users.push({ id });
      }
      return {
        id,
        px: Number(r.score),
      };
    });
    stats.push(dData);
  }
  return {
    users,
    stats,
  };
}

/*
 * get top 10 countries over the past days
 */
export async function getCountryDailyHistory() {
  const ret = [];
  let ts;
  let key;
  for (let c = 0; c < 14; c += 1) {
    if (!ts) {
      ts = Date.now();
      key = CDAY_STATS_RANKS_KEY;
    } else {
      ts -= 1000 * 3600 * 24;
      const dateKey = getDateKeyOfTs(ts);
      key = `${CDAY_STATS_RANKS_KEY}:${dateKey}`;
    }
    // eslint-disable-next-line no-await-in-loop
    let dData = await client.zRangeWithScores(key, 0, 9, {
      REV: true,
    });
    dData = dData.map((r) => ({
      cc: r.value,
      px: Number(r.score),
    }));
    ret.push(dData);
  }
  return ret;
}

/*
 * reset daily ranks
 * @return boolean for success
 */
export async function resetDailyRanks() {
  // store top 10
  await client.zRangeStore(PREV_DAY_TOP_KEY, DAILY_RANKED_KEY, 0, 9, {
    REV: true,
  });
  // store day
  const dateKey = getDateKeyOfTs(
    Date.now() - 1000 * 3600 * 24,
  );
  await client.rename(
    DAILY_RANKED_KEY,
    `${DAY_STATS_RANKS_KEY}:${dateKey}`,
  );
  await client.rename(
    DAILY_CRANKED_KEY,
    `${CDAY_STATS_RANKS_KEY}:${dateKey}`,
  );
}
