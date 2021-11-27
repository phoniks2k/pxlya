/*
 * Markdown parsing
 *
 * We do not support all markdown, but do additionally parse extra
 * stuff like pixelplanet coords and usernames and bare links.
 * This code is written in preparation for a possible imporementation in
 * WebAssambly, so it's all in a big loop
 *
 * @flow
 */

let parseMText = () => {};

class MString {
  constructor(text, start) {
    this.txt = text;
    this.iter = start || 0;
  }

  nextChar() {
    this.iter += 1;
    return this.txt[this.iter];
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

/*
 * Parse Paragraph till next newline
 */
function parseMParagraph(text, opts) {
  const pArray = [];
  let pStart = text.iter;
  let pEnd = 0;
  while (!text.done()) {
    const chr = text.getChar();
    let newElem = null;
    if (chr === '`') {
      const oldPos = text.iter;
      text.moveForward();
      if (text.goToCharInLine('`')) {
        newElem = ['c', text.slice(oldPos + 1)];
        pEnd = oldPos;
      }
    }
    /*
    else if (text.startsWith('**', iter) {
    }
    */
    if (pEnd) {
      if (pStart !== pEnd) {
        pArray.push(text.slice(pStart, pEnd));
      }
      pStart = text.iter + 1;
      pEnd = 0;
      pArray.push(newElem);
    }
    text.moveForward();
    if (chr === '\n') {
      break;
    }
  }
  if (pStart !== text.iter) {
    pArray.push(text.slice(pStart));
  }
  return pArray;
}

/*
 * parse Code Block
 * start is first character after the initializing ```
 * we just parse till the ending occures
 */
function parseCodeBlock(text) {
  text.skipSpaces(false);
  if (text.getChar === '\n') {
    text.moveForward();
  }
  const cbStart = text.iter;
  while (!text.done()) {
    text.skipSpaces(true);
    if (text.has('```')) {
      const elem = ['cb', text.slice(cbStart)];
      text.move(3);
      return elem;
    }
    text.moveToNextLine();
  }
  const cbText = text.slice(cbStart);
  text.move(3);
  return ['cb', cbText];
}

/*
 * parse quote
 */
function parseQuote(text, opts) {
  // either '<' or '>'
  const quoteChar = text.getChar();
  let quoteText = '';
  while (text.getChar() === quoteChar && text.moveForward()) {
    const line = text.getLine();
    quoteText += line;
  }
  const mQuoteText = new MString(quoteText);
  return [quoteChar, parseMText(mQuoteText, opts, 0)];
}

/*
 * parses Section (contains paragraphs, lists, etc. but no headings or quotes)
 * @param text MString
 * @param headingLevel the number of heading headingLevels we are in
 * @param indent ndentation that should be considered (when inside list)
 * returns when encountering heading of <= headingLevel (iter is at # position)
 *   or heading-cancel with three spaces (iter is past newlines)
 *   or ident is smaller than given
 */
function parseMSection(
  text: string,
  opts: Object,
  headingLevel,
  indent,
) {
  const mdArray = [];
  let pArray = [];
  let lineNr = 0;

  while (!text.done()) {
    const paraLineStart = text.iter;
    lineNr += 1;

    // this also skips spaces
    const curIndent = text.getIndent(opts.tabWidth);

    /*
     * act on indent
     */
    if (curIndent < indent && lineNr > 1) {
      text.setIter(paraLineStart);
      break;
    }

    const chr = text.getChar();

    /*
     * break on heading
     */
    if (!indent && chr === '#') {
      break;
    }

    /*
     * is unordered list
     */
    let isUnorderedList = false;
    let isOrderedList = false;
    if (chr === '-') {
      isUnorderedList = true;
      text.moveForward();
    }

    /*
     * is ordered list
     */
    if (!Number.isNaN(parseInt(chr, 10))) {
      let itern = text.iter + 1;
      for (;!Number.isNaN(parseInt(text.txt[itern], 10)); itern += 1);
      const achr = text.txt[itern];
      if (achr === '.' || achr === ')') {
        isOrderedList = true;
        text.setIter(itern + 1);
      }
    }

    let pushPArray = false;
    let insertElem = null;

    if (isUnorderedList || isOrderedList) {
      /*
       * parse lists
       */
      if (pArray.length) {
        mdArray.push(['p', pArray]);
        pArray = [];
      }
      let childMdArray;
      childMdArray = parseMSection(
        text,
        opts,
        headingLevel,
        curIndent + 1,
      );
      childMdArray = ['-', childMdArray];
      // lists are encapsuled
      const capsule = (isUnorderedList) ? 'ul' : 'ol';
      if (!mdArray.length || mdArray[mdArray.length - 1][0] !== capsule) {
        mdArray.push([capsule, [childMdArray]]);
      } else {
        mdArray[mdArray.length - 1][1].push(childMdArray);
      }
    } else if (chr === '>' || chr === '<') {
      /*
       * quotes
       */
      pushPArray = true;
      insertElem = parseQuote(text, opts);
    } else if (text.has('```')) {
      /*
       * code block
       */
      pushPArray = true;
      text.move(3);
      insertElem = parseCodeBlock(text);
    } else if (!indent && chr === '\n') {
      /*
       * break on multiple newlines
       */
      text.moveForward();
      text.skipSpaces(false);
      if (text.getChar() === '\n') {
        if (headingLevel && opts.newlineBreaksArticles) {
          break;
        }
        text.moveForward();
      }
      pushPArray = true;
    } else {
      /*
       * ordinary text aka paragraph
       */
      const pPArray = parseMParagraph(text, opts);
      if (pPArray) {
        pArray = pArray.concat(pPArray);
      }
      continue;
    }

    if (pushPArray && pArray.length) {
      mdArray.push(['p', pArray]);
      pArray = [];
    }

    if (insertElem) {
      mdArray.push(insertElem);
    }
  }

  if (pArray.length) {
    mdArray.push(['p', pArray]);
  }

  return mdArray;
}

parseMText = (text, opts, headingLevel) => {
  let mdArray = [];
  while (!text.done()) {
    const aMdArray = parseMSection(
      text, opts, headingLevel, 0,
    );
    mdArray = mdArray.concat(aMdArray);
    // either heading hit or article end
    const chr = text.getChar();
    if (chr === '#') {
      let subLvl = text.countRepeatingCharacters();
      if (subLvl <= headingLevel || headingLevel === 6) {
        // end of article
        // encountered title with same headingLevel or lower
        break;
      } else {
        // child article
        text.move(subLvl);
        const title = text.getLine();
        subLvl = Math.min(subLvl, 6);
        const subMdArray = parseMText(
          text, opts, subLvl,
        );
        mdArray.push(['a', subLvl, title, subMdArray]);
      }
    } else {
      break;
    }
  }

  return mdArray;
};

function parseOpts(inOpts) {
  const opts = {};
  opts.parseLinks = (inOpts && inOpts.parseLinks) || false;
  opts.tabWidth = (inOpts && inOpts.tabWidth) || 4;
  opts.newlineBreaksArticles = (inOpts && inOpts.newlineBreaksArticles) || true;
  return opts;
}

export function parseParagraph(text: string, inOpts) {
  const opts = parseOpts(inOpts);
  const mText = new MString(text);
  return parseMParagraph(mText, opts);
}

export function parse(text: string, inOpts) {
  const opts = parseOpts(inOpts);
  const mText = new MString(text);
  return parseMText(mText, opts, 0);
}
