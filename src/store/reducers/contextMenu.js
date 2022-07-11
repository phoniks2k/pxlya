/**
 * https://stackoverflow.com/questions/35623656/how-can-i-display-a-modal-dialog-in-redux-that-performs-asynchronous-actions/35641680#35641680
 *
 */

const initialState = {
  menuOpen: false,
  menuType: null,
  xPos: 0,
  yPos: 0,
  args: {},
};


export default function contextMenu(
  state = initialState,
  action,
) {
  switch (action.type) {
    case 'SHOW_CONTEXT_MENU': {
      const {
        menuType, xPos, yPos, args,
      } = action;
      return {
        ...state,
        menuType,
        xPos,
        yPos,
        menuOpen: true,
        args: {
          ...args,
        },
      };
    }

    case 'WINDOW_RESIZE':
    case 'HIDE_CONTEXT_MENU': {
      return {
        ...state,
        menuOpen: false,
      };
    }

    default:
      return state;
  }
}
