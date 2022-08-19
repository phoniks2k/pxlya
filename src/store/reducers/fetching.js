/*
 * keeps track of some api fetching states
 *
 */

const initialState = {
  fetchingChunks: 0,
  fetchingChat: false,
  fetchinApi: false,
};

export default function fetching(
  state = initialState,
  action,
) {
  switch (action.type) {
    case 's/SET_CHAT_FETCHING': {
      const { fetching: fetchingChat } = action;
      return {
        ...state,
        fetchingChat,
      };
    }

    case 'SET_API_FETCHING': {
      const { fetching: fetchinApi } = action;
      return {
        ...state,
        fetchinApi,
      };
    }

    case 'REQ_BIG_CHUNK': {
      const {
        fetchingChunks,
      } = state;

      return {
        ...state,
        fetchingChunks: fetchingChunks + 1,
      };
    }

    case 'REC_BIG_CHUNK': {
      const { fetchingChunks } = state;

      return {
        ...state,
        fetchingChunks: fetchingChunks - 1,
      };
    }

    case 'REC_BIG_CHUNK_FAILURE': {
      const { fetchingChunks } = state;

      return {
        ...state,
        fetchingChunks: fetchingChunks - 1,
      };
    }

    default:
      return state;
  }
}
