/*
 * keeping track of open popups
 */

class PopUps {
  constructor() {
    this.wins = [];
    this.origin = window.location.origin;
    this.closeAll = this.closeAll.bind(this);
    window.addEventListener('beforeunload', this.closeAll);
  }

  open(xPos, yPos, width, height) {
    let left;
    let top;
    try {
      left = Math.round(window.top.screenX + xPos);
      top = Math.round(window.top.screenY + yPos);
      if (Number.isNaN(left) || Number.isNaN(top)) {
        throw new Error('NaN');
      }
    } catch {
      left = 0;
      top = 0;
    }
    try {
      const newWindow = window.open(
        './win',
        'lol',
        `popup=yes,width=${width},height=${height},left=${left},top=${top},toolbar=no,status=no,directories=no,menubar=no`,
      );
      this.wins.push(newWindow);
    } catch {
      // nothing, just don't bubble up
    }
  }

  dispatch(msg) {
    const { wins } = this;
    console.log('sending', msg);
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

export default popUps;
