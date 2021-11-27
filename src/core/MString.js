/*
 * class for string iterations
 * that is used by MarkdownParser.js
 */

export default class MString {
  constructor(text, start) {
    this.txt = text;
    this.iter = start || 0;
  }

  done() {
    return (this.iter >= this.txt.length);
  }

  moveForward() {
    this.iter += 1;
    return (this.iter < this.txt.length);
  }

  setIter(iter) {
    this.iter = iter;
  }

  getChar() {
    return this.txt[this.iter];
  }

  slice(start, end) {
    return this.txt.slice(start, end || this.iter);
  }

  has(str) {
    return this.txt.startsWith(str, this.iter);
  }

  move(cnt) {
    this.iter += cnt;
    return (this.iter < this.txt.length);
  }

  skipSpaces(skipNewlines = false) {
    for (;this.iter < this.txt.length; this.iter += 1) {
      const chr = this.txt[this.iter];
      if (chr !== ' ' && chr !== '\t' && (!skipNewlines || chr !== '\n')) {
        break;
      }
    }
  }

  countRepeatingCharacters() {
    const chr = this.getChar();
    let newIter = this.iter + 1;
    for (;newIter < this.txt.length && this.txt[newIter] === chr;
      newIter += 1
    );
    return newIter - this.iter;
  }

  moveToNextLine() {
    const lineEnd = this.txt.indexOf('\n', this.iter);
    if (lineEnd === -1) {
      this.iter = this.txt.length;
    } else {
      this.iter = lineEnd + 1;
    }
  }

  getLine() {
    const startLine = this.iter;
    this.moveToNextLine();
    return this.txt.slice(startLine, this.iter);
  }

  getIndent(tabWidth) {
    let indent = 0;
    while (this.iter < this.txt.length) {
      const chr = this.getChar();
      if (chr === '\t') {
        indent += tabWidth;
      } else if (chr === ' ') {
        indent += 1;
      } else {
        break;
      }
      this.iter += 1;
    }
    return indent;
  }

  goToCharInLine(chr) {
    let { iter } = this;
    for (;
      iter < this.txt.length && this.txt[iter] !== '\n'
        && this.txt[iter] !== chr;
      iter += 1
    );
    if (this.txt[iter] === chr) {
      this.iter = iter;
      return iter;
    }
    return false;
  }
}
