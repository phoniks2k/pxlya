import { createNameRegExp } from '../core/utils';

const initialState = {
  name: null,
  center: [0, 0],
  wait: null,
  coolDown: null, // ms
  lastCoolDownEnd: null,
  requestingPixel: true,
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
  // regExp for detecting ping
  nameRegExp: null,
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
        lastCoolDownEnd: new Date(),
        wait: null,
      };
    }

    case 'SET_REQUESTING_PIXEL': {
      const { requestingPixel } = action;
      return {
        ...state,
        requestingPixel,
      };
    }

    case 'SET_WAIT': {
      const { wait: duration } = action;
      const wait = duration
        ? new Date(Date.now() + duration)
        : null;
      return {
        ...state,
        wait,
      };
    }

    case 'RECEIVE_COOLDOWN': {
      const { wait: duration } = action;
      const wait = duration
        ? new Date(Date.now() + duration)
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

    case 'RECEIVE_ME':
    case 'LOGIN': {
      const {
        name,
        mailreg,
        blockDm,
        userlvl,
      } = action;
      const nameRegExp = createNameRegExp(name);
      const messages = (action.messages) ? action.messages : [];
      return {
        ...state,
        name,
        messages,
        mailreg,
        blockDm,
        userlvl,
        nameRegExp,
      };
    }

    case 'LOGOUT': {
      return {
        ...state,
        name: null,
        messages: [],
        mailreg: false,
        blockDm: false,
        userlvl: 0,
        nameRegExp: null,
      };
    }

    case 'SET_NAME': {
      const { name } = action;
      const nameRegExp = createNameRegExp(name);
      return {
        ...state,
        name,
        nameRegExp,
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
