/* @flow */

const initialState = {
  mute: false,
  chatNotify: true,
};


export default function audio(
  state = initialState,
  action,
) {
  switch (action.type) {
    case 'TOGGLE_MUTE':
      return {
        ...state,
        mute: !state.mute,
      };

    case 'TOGGLE_CHAT_NOTIFY':
      return {
        ...state,
        chatNotify: !state.chatNotify,
      };

    default:
      return state;
  }
}
