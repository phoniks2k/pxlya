
const initialState = {
  lastFetch: 0,
  totalPixels: 0,
  dailyTotalPixels: 0,
  ranking: 1488,
  dailyRanking: 1488,
  // global stats
  /*
   * {
   *   total: totalUsersOnline,
   *   canvasId: onlineAtCanvas,
   * }
   */
  online: {
    total: 0,
  },
  totalRanking: [],
  totalDailyRanking: [],
  dailyCRanking: [],
  prevTop: [],
  onlineStats: [],
  cHistStats: [],
  histStats: [],
};

export default function ranks(
  state = initialState,
  action,
) {
  switch (action.type) {
    case 'REC_PXL_RETURN': {
      const {
        rankedPxlCnt,
      } = action;
      if (!rankedPxlCnt) {
        return state;
      }
      let { totalPixels, dailyTotalPixels } = state;
      totalPixels += rankedPxlCnt;
      dailyTotalPixels += rankedPxlCnt;
      return {
        ...state,
        totalPixels,
        dailyTotalPixels,
      };
    }

    case 'REC_ONLINE': {
      const { online } = action;
      return {
        ...state,
        online,
      };
    }

    case 's/REC_ME':
    case 's/LOGIN': {
      if (!action.totalPixels) {
        return state;
      }
      const {
        totalPixels,
        dailyTotalPixels,
        ranking,
        dailyRanking,
      } = action;
      return {
        ...state,
        totalPixels,
        dailyTotalPixels,
        ranking,
        dailyRanking,
      };
    }

    case 'REC_STATS': {
      const {
        totalRanking,
        totalDailyRanking,
        dailyCRanking,
        prevTop,
        onlineStats,
        cHistStats,
        histStats,
      } = action;
      const lastFetch = Date.now();
      return {
        ...state,
        lastFetch,
        totalRanking,
        totalDailyRanking,
        dailyCRanking,
        prevTop,
        onlineStats,
        cHistStats,
        histStats,
      };
    }

    default:
      return state;
  }
}
