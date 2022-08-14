/*
 * state for open windows and its content
 */

import { clamp } from '../../core/utils';

const SCREEN_MARGIN_S = 30;
const SCREEN_MARGIN_EW = 70;
const MIN_WIDTH = 70;
const MIN_HEIGHT = 50;
// if screen smaller than this, hide all windows and just
// allow Modals
const SCREEN_WIDTH_THRESHOLD = 604;
// how many windows can be open
const MAX_AMOUNT_WINDOWS = 100;

function generateWindowId(state) {
  let windowId = Math.floor(Math.random() * 99999) + 1;
  while (state.args[windowId]) {
    windowId += 1;
  }
  return windowId;
}

/*
 * clamp size and position to screen borders and restrictions
 */
function clampSize(prefWidth, prefHeight, margin = false) {
  let maxWidth = window.innerWidth;
  let maxHeight = window.innerHeight;
  if (margin) {
    // same as modal in default.css
    maxWidth = Math.floor(maxWidth * 0.70);
    maxHeight = Math.floor(Math.min(maxHeight * 0.80, 900));
  }
  const width = prefWidth || maxWidth;
  const height = prefHeight || maxHeight;
  return [
    clamp(
      width,
      MIN_WIDTH,
      maxWidth,
    ),
    clamp(
      height,
      MIN_HEIGHT,
      maxHeight,
    ),
  ];
}

function clampPos(prefXPos, prefYPos, width, height) {
  const xPos = (prefXPos || prefXPos === 0) ? prefXPos
    : Math.floor((window.innerWidth - width) / 2);
  const yPos = (prefYPos || prefYPos === 0) ? prefYPos
    : Math.floor((window.innerHeight - height) / 2);
  return [
    clamp(
      xPos,
      SCREEN_MARGIN_EW - width,
      window.innerWidth - SCREEN_MARGIN_EW,
    ),
    clamp(
      yPos,
      0,
      window.innerHeight - SCREEN_MARGIN_S,
    ),
  ];
}

/*
 * resort the zIndex, remove gaps
 */
function sortWindows(newState, force = false) {
  if (newState.zMax >= MAX_AMOUNT_WINDOWS * 0.5 || force) {
    const orderedZ = newState.windows.map((win) => win.z)
      .sort((a, b) => !b || (a && a >= b));
    newState.windows = newState.windows.map((win) => ({
      ...win,
      z: orderedZ.indexOf(win.z),
    }));
    newState.zMax = orderedZ.length - 1;
  }
  return newState;
}

const initialState = {
  // if windows get shown, false on small screens
  showWindows: window.innerWidth > SCREEN_WIDTH_THRESHOLD,
  // if at least one window is in fullscreen
  someFullscreen: false,
  // highest zIndex of window
  zMax: 0,
  // [
  //   {
  //     windowId: number,
  //     open: boolean,
  //     hidden: boolean,
  //     fullscreen: boolean,
  //     z: number,
  //     windowType: string,
  //     title: string,
  //       title that is additionally shown to the window-type-title
  //     width: number,
  //     height: number,
  //     xPos: percentage,
  //     yPos: percentage,
  //     cloneable: boolean,
  //   },
  // ]
  windows: [],
  // {
  //   windowId: {
  //    ...
  //   }
  // }
  // args is a object with values defining a state of the window
  // and can be set by the window itself,
  // in order to remember stuff on cloning, maximizing, etc.
  // Mostly it is empty or null
  args: {},
};

export default function windows(
  state = initialState,
  action,
) {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      /*
       * prefered xPos, yPos, height adn width
       * can be given in action (but doesn't have to)
       */
      const {
        windowType,
        title,
        cloneable,
        args,
        xPos: prefXPos,
        yPos: prefYPos,
        width: prefWidth,
        height: prefHeight,
      } = action;

      const [width, height] = clampSize(prefWidth, prefHeight, true);
      const [xPos, yPos] = clampPos(prefXPos, prefYPos, width, height);

      const fullscreen = !state.showWindows || action.fullscreen;

      if (state.windows.length >= MAX_AMOUNT_WINDOWS) {
        return state;
      }
      const windowId = generateWindowId(state);
      const newZMax = state.zMax + 1;
      const newWindows = [
        ...state.windows,
        {
          windowId,
          windowType,
          open: true,
          hidden: false,
          fullscreen,
          z: newZMax,
          title,
          width,
          height,
          xPos,
          yPos,
          cloneable,
        },
      ];

      const someFullscreen = newWindows.some(
        (win) => win.fullscreen && !win.hidden,
      );

      return sortWindows({
        ...state,
        someFullscreen,
        zMax: newZMax,
        windows: newWindows,
        args: {
          ...state.args,
          [windowId]: {
            ...args,
          },
        },
      });
    }

    case 'REMOVE_WINDOW': {
      const {
        windowId,
      } = action;
      const args = { ...state.args };
      delete args[windowId];

      return {
        ...state,
        windows: state.windows.filter((win) => win.windowId !== windowId),
        args,
      };
    }

    case 'CLOSE_WINDOW': {
      const {
        windowId,
      } = action;

      const newWindows = state.windows.map((win) => {
        if (win.windowId !== windowId) return win;
        return {
          ...win,
          open: false,
        };
      });

      const someFullscreen = newWindows.some(
        (win) => win.fullscreen && !win.hidden,
      );

      return {
        ...state,
        someFullscreen,
        windows: newWindows,
      };
    }

    case 'CLOSE_ALL_WINDOW_TYPE': {
      const {
        windowType,
      } = action;
      const newWindows = state.windows.map((win) => {
        if (win.windowType !== windowType) return win;
        return {
          ...win,
          open: false,
        };
      });

      const someFullscreen = newWindows.some(
        (win) => win.fullscreen && !win.hidden,
      );

      return {
        ...state,
        someFullscreen,
        windows: newWindows,
      };
    }

    case 'HIDE_ALL_WINDOW_TYPE': {
      const {
        windowType,
        hide,
      } = action;
      const newWindows = state.windows.map((win) => {
        if (win.windowType !== windowType) return win;
        return {
          ...win,
          hidden: hide,
        };
      });
      return {
        ...state,
        windows: newWindows,
      };
    }

    case 'CLONE_WINDOW': {
      const {
        windowId,
      } = action;
      const win = state.windows.find((w) => w.windowId === windowId);
      const newWindowId = generateWindowId(state);
      const newZMax = state.zMax + 1;
      const {
        innerWidth: width,
        innerHeight: height,
      } = window;
      return sortWindows({
        ...state,
        zMax: newZMax,
        windows: [
          ...state.windows,
          {
            ...win,
            windowId: newWindowId,
            xPos: Math.min(win.xPos + 15, width - SCREEN_MARGIN_EW),
            yPos: Math.min(win.yPos + 15, height - SCREEN_MARGIN_S),
            z: newZMax,
          },
        ],
        args: {
          ...state.args,
          [newWindowId]: {
            ...state.args[windowId],
          },
        },
      });
    }

    case 'CHANGE_WINDOW_TYPE': {
      const {
        windowId,
        windowType,
        title,
      } = action;
      const args = {
        ...state.args,
        [windowId]: {
          ...action.args,
        },
      };
      const newWindows = state.windows.map((win) => {
        if (win.windowId !== windowId) return win;
        return {
          ...win,
          windowType,
          title,
        };
      });

      const someFullscreen = newWindows.some(
        (win) => win.fullscreen && !win.hidden,
      );

      return {
        ...state,
        someFullscreen,
        args,
        windows: newWindows,
      };
    }

    case 'FOCUS_WINDOW': {
      const {
        windowId,
      } = action;
      const {
        windows: oldWindows, zMax,
      } = state;

      const newWindows = [];

      for (let i = 0; i < oldWindows.length; i += 1) {
        const win = oldWindows[i];
        if (win.windowId !== windowId) {
          newWindows.push(win);
        } else {
          if (win.z === zMax) {
            return state;
          }
          newWindows.push({
            ...win,
            z: zMax + 1,
          });
        }
      }
      return sortWindows({
        ...state,
        zMax: zMax + 1,
        windows: newWindows,
      });
    }

    case 'TOGGLE_MAXIMIZE_WINDOW': {
      const {
        windowId,
      } = action;

      const newWindows = state.windows.map((win) => {
        if (win.windowId !== windowId) return win;
        return {
          ...win,
          fullscreen: !win.fullscreen,
          open: true,
          hidden: false,
        };
      });

      const someFullscreen = newWindows.some(
        (win) => win.fullscreen && !win.hidden,
      );

      return {
        ...state,
        someFullscreen,
        windows: newWindows,
      };
    }

    case 'CLOSE_FULLSCREEN_WINDOWS': {
      const newWindows = state.windows.map((win) => {
        if (win.fullscreen) {
          return {
            ...win,
            open: false,
          };
        }
        return win;
      });

      return {
        ...state,
        someFullscreen: false,
        windows: newWindows,
      };
    }

    case 'MOVE_WINDOW': {
      const {
        windowId,
        xDiff,
        yDiff,
      } = action;
      const newWindows = state.windows.map((win) => {
        if (win.windowId !== windowId) return win;
        const [xPos, yPos] = clampPos(
          win.xPos + xDiff,
          win.yPos + yDiff,
          win.width,
          win.height,
        );
        return {
          ...win,
          xPos,
          yPos,
        };
      });
      return {
        ...state,
        windows: newWindows,
      };
    }

    case 'RESIZE_WINDOW': {
      const {
        windowId,
        xDiff,
        yDiff,
      } = action;
      const newWindows = state.windows.map((win) => {
        if (win.windowId !== windowId) return win;
        const [width, height] = clampSize(
          win.width + xDiff,
          win.height + yDiff,
          false,
        );
        return {
          ...win,
          width: Math.max(width, SCREEN_MARGIN_EW - win.xPos),
          height,
        };
      });
      return {
        ...state,
        windows: newWindows,
      };
    }

    case 'RECEIVE_ME':
    case 'WINDOW_RESIZE': {
      const {
        innerWidth: width,
        innerHeight: height,
      } = window;

      let { windows: newWindows, args, someFullscreen } = state;
      const showWindows = width > SCREEN_WIDTH_THRESHOLD;

      if (action.type === 'RECEIVE_ME') {
        if (state.modal) {
          // reset if out of date
          return initialState;
        }

        args = { ...state.args };

        newWindows = newWindows.filter((win) => {
          if (win.open && (win.fullscreen || showWindows)) {
            return true;
          }
          // eslint-disable-next-line no-console
          console.log(
            `Cleaning up window from previous session: ${win.windowId}`,
          );
          delete args[win.windowId];
          return false;
        });

        someFullscreen = newWindows.some(
          (win) => win.fullscreen && !win.hidden,
        );
      }

      if (!showWindows) {
        return {
          ...state,
          windows: newWindows,
          showWindows,
          someFullscreen,
          args,
        };
      }

      const xMax = width - SCREEN_MARGIN_EW;
      const yMax = height - SCREEN_MARGIN_S;
      let modified = false;
      const fixWindows = [];

      for (let i = 0; i < newWindows.length; i += 1) {
        const win = newWindows[i];
        const {
          xPos,
          yPos,
          width: winWidth,
          height: winHeight,
        } = win;
        if (xPos > xMax || yPos > yMax
          || width > winWidth || height > winHeight) {
          modified = true;
          fixWindows.push({
            ...win,
            xPos: Math.min(xMax, xPos),
            yPos: Math.min(yMax, yPos),
            width: Math.min(winWidth, width - SCREEN_MARGIN_S),
            height: Math.min(winHeight, height - SCREEN_MARGIN_S),
          });
        } else {
          fixWindows.push(win);
        }
      }

      return {
        ...state,
        windows: (modified) ? fixWindows : newWindows,
        showWindows: true,
        someFullscreen,
        args,
      };
    }

    case 'SET_WINDOW_TITLE': {
      const {
        windowId,
        title,
      } = action;
      const newWindows = state.windows.map((win) => {
        if (win.windowId !== windowId) return win;
        return {
          ...win,
          title,
        };
      });
      return {
        ...state,
        windows: newWindows,
      };
    }

    case 'SET_WINDOW_ARGS': {
      const {
        windowId,
        args,
      } = action;
      return {
        ...state,
        args: {
          ...state.args,
          [windowId]: {
            ...state.args[windowId],
            ...args,
          },
        },
      };
    }

    default:
      return state;
  }
}
