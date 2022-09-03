/*
 * keeping track of open popups
 */
import { unload } from '../store/actions';

class PopUps {
  constructor() {
    this.wins = [];
    this.origin = window.location.origin;
    window.addEventListener('beforeunload', () => {
      this.dispatch(unload());
    });
  }

  add(win) {
    const pos = this.wins.indexOf(win);
    if (pos === -1) {
      this.wins.push(win);
    }
  }

  remove(win) {
    const pos = this.wins.indexOf(win);
    if (~pos) this.wins.splice(pos, 1);
  }

  dispatch(msg) {
    const { wins } = this;
    try {
      for (let i = 0; i < wins.length; i += 1) {
        const win = wins[i];
        if (win.closed) {
          wins.splice(i, 1);
          i -= 1;
          continue;
        }
        win.postMessage(msg, this.origin);
      }
    } catch {
      return false;
    }
    return true;
  }

  closeAll() {
    while (this.wins.length) {
      const win = this.wins.pop();
      win.close();
    }
  }
}

const popUps = new PopUps();

export function openPopUp(url, xPos, yPos, width, height) {
  let left;
  let top;
  try {
    if (window.innerWidth <= 604) {
      width = window.innerWidth;
      height = window.innerHeight;
      left = window.top.screenX;
      top = window.top.screenY;
    } else {
      left = Math.round(window.top.screenX + xPos);
      top = Math.round(window.top.screenY + yPos);
    }
    if (Number.isNaN(left) || Number.isNaN(top)) {
      throw new Error('NaN');
    }
  } catch {
    left = 0;
    top = 0;
  }
  try {
    return window.open(
      url,
      url,
      // eslint-disable-next-line max-len
      `popup=yes,width=${width},height=${height},left=${left},top=${top},toolbar=no,status=no,directories=no,menubar=no`,
    );
  } catch {
    return null;
  }
}

export default popUps;
