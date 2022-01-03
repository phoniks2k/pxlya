
const initialState = {
  totalPixels: 0,
  dailyTotalPixels: 0,
  ranking: 1488,
  dailyRanking: 1488,
  // global stats
  online: 1,
  totalRanking: {},
  totalDailyRanking: {},
};

export default function ranks(
  state = initialState,
  action,
) {
  switch (action.type) {
    case 'PLACED_PIXELS': {
      let { totalPixels, dailyTotalPixels } = state;
      const { amount } = action;
      totalPixels += amount;
      dailyTotalPixels += amount;
      return {
        ...state,
        totalPixels,
        dailyTotalPixels,
      };
    }

    case 'RECEIVE_ONLINE': {
      const { online } = action;
      return {
        ...state,
        online,
      };
    }

    case 'RECEIVE_ME':
    case 'LOGIN': {
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

    case 'RECEIVE_STATS': {
      const { totalRanking, totalDailyRanking } = action;
      return {
        ...state,
        totalRanking,
        totalDailyRanking,
      };
    }

    default:
      return state;
  }
}
