const initialState = {
  id: null,
  name: null,
  wait: null,
  coolDown: null, // ms
  lastCoolDownEnd: null,
  allowSettingPixel: true,
  // messages are sent by api/me, like not_verified status
  messages: [],
  mailreg: false,
  // blocking all Dms
  blockDm: false,
  // if user is using touchscreen
  isOnMobile: false,
  // small notifications for received cooldown
  notification: null,
  // 1: Admin, 2: Mod, 0: ordinary user
  userlvl: 0,
};

export default function user(
  state = initialState,
  action,
) {
  switch (action.type) {
    case 'COOLDOWN_SET': {
      const { coolDown } = action;
      return {
        ...state,
        coolDown: coolDown || null,
      };
    }

    case 'COOLDOWN_END': {
      return {
        ...state,
        coolDown: null,
        lastCoolDownEnd: Date.now(),
        wait: null,
      };
    }

    case 'ALLOW_SETTING_PIXEL': {
      const { allowSettingPixel } = action;
      return {
        ...state,
        allowSettingPixel,
      };
    }

    case 'REC_PIXEL_RETURN': {
      const {
        wait: duration,
      } = action;
      return {
        ...state,
        wait: (duration) ? Date.now() + duration : state.wait,
        allowSettingPixel: true,
      };
    }

    case 'REC_COOLDOWN': {
      const { wait: duration } = action;
      const wait = duration
        ? Date.now() + duration
        : null;
      return {
        ...state,
        wait,
        coolDown: null,
      };
    }

    case 'SET_MOBILE': {
      const { mobile: isOnMobile } = action;
      return {
        ...state,
        isOnMobile,
      };
    }

    case 'REC_ME':
    case 'LOGIN': {
      const {
        id,
        name,
        mailreg,
        blockDm,
        userlvl,
      } = action;
      const messages = (action.messages) ? action.messages : [];
      return {
        ...state,
        id,
        name,
        messages,
        mailreg,
        blockDm,
        userlvl,
      };
    }

    case 'LOGOUT': {
      return {
        ...state,
        id: null,
        name: null,
        messages: [],
        mailreg: false,
        blockDm: false,
        userlvl: 0,
      };
    }

    case 'SET_NAME': {
      const { name } = action;
      return {
        ...state,
        name,
      };
    }

    case 'SET_BLOCKING_DM': {
      const { blockDm } = action;
      return {
        ...state,
        blockDm,
      };
    }

    case 'SET_NOTIFICATION': {
      return {
        ...state,
        notification: action.notification,
      };
    }

    case 'UNSET_NOTIFICATION': {
      return {
        ...state,
        notification: null,
      };
    }

    case 'REM_FROM_MESSAGES': {
      const { message } = action;
      const messages = [...state.messages];
      const index = messages.indexOf(message);
      if (index > -1) {
        messages.splice(index);
      }
      return {
        ...state,
        messages,
      };
    }

    case 'SET_MAILREG': {
      const { mailreg } = action;
      return {
        ...state,
        mailreg,
      };
    }

    default:
      return state;
  }
}
