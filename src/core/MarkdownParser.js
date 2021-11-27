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

export default class MarkdownParser {
  static nonWithespace = /\S|$/;
  static expArticle = /(?:\n|^)\s*?(?=\#)|(?<=(?:\n|^)\s*?(?=\#).*?)\n/;

  constructor(opt) {
    this.parseLinks = opt && opt.parseLinks || false;
    this.tabWidth = opt && opt.tabWidth || 4;
    this.newlineBreaksArticles = opt && opt.newlineBreaksArticles || true;
  }

  parse(text: string) {
    return this.parseText(text, 0, 0)[0];
  }

  parseText(text, headingLevel, start) {
    let mdArray = [];
    let iter = start;
    while (iter < text.length) {
      const [aMdArray, newIter] = this.parseSection(
        text, iter, headingLevel,
      );
      iter = newIter;
      mdArray = mdArray.concat(aMdArray);
      // either heading hit or article end
      const chr = text[iter];
      if (chr === '#') {
        let subLvl = 0;
        for (;
          iter + subLvl <= text.length && text[iter + subLvl] === '#';
          subLvl += 1
        ) {}
        if (subLvl <= headingLevel || headingLevel === 6) {
          // end of article
          // encountered title with same headingLevel or lower
          break;
        } else {
          // child article
          let lineEnd = text.indexOf('\n', iter);
          if (lineEnd === -1) lineEnd = text.length;
          const title = text.slice(iter + subLvl, lineEnd).trimLeft();
          subLvl = Math.min(subLvl, 6);
          const [subMdArray, newIter] = this.parseText(
            text, subLvl, lineEnd + 1,
          );
          mdArray.push(['a', subLvl, title, subMdArray]);
          iter = newIter;
        }
      } else {
        break;
      }
    }

    return [mdArray, iter];
  }

  static stoppingCondition(text: string, iter: number) {
    const chr = text[iter];
    if (chr === '\n'
      || chr === '#'
    ) {
      return true;
    }
    return false;
  }

  /*
   * parses Articles (contains paragraphs, code-blocks, numeration, etc.)
   * @param text string of text
   * @param start number of position in text where to start
   * @param headingLevel the number of heading headingLevels we are in
   * @param indent ndentation that should be considered
   * returns when encountering heading of <= headingLevel (iter is at # position)
   *   or heading-cancel with three spaces (iter is past newlines)
   *   or ident is smaller than given
   */
  parseSection(
    text: string,
    start: number,
    headingLevel = 0,
    indent = 0,
  ) {
    let iter = start;
    const mdArray = [];
    let pArray = [];
    let paraStart = iter;
    let lineNr = 0;

    const  addParagraph = (start, end) => {
      /*
      let paraText = text.slice(start, end);
      mdArray.push(['p', paraText]);
      */
      mdArray.push(['p', pArray]);
      pArray = [];
    }

    while (true) {
      if (iter >= text.length) {
        if (paraStart < text.length) {
          addParagraph(paraStart, text.length);
        }
        break;
      }

      const paraLineStart = iter;
      lineNr += 1;

      /*
       * act on indent
       */
      let curIndent;
      [curIndent, iter] = this.getIndent(text, iter);
      if (curIndent < indent && lineNr > 1) {
        if (paraLineStart - 1 > paraStart) {
          addParagraph(paraStart, paraLineStart - 1);
        }
        iter = paraLineStart;
        break;
      }

      const chr = text[iter];

      /*
       * unordered list
       */
      let isUnorderedList = false;
      let isOrderedList = false;
      if (chr === '-') {
        isUnorderedList = true;
        iter += 1;
      }

      /*
       * ordered list
       */
      if (!Number.isNaN(parseInt(chr))) {
        let itern = iter + 1;
        for(;!Number.isNaN(parseInt(text[itern])); itern += 1){}
        if (text[itern] === '.' || text[itern] === ')') {
          isOrderedList = true;
          iter = itern + 1;
        }
      }

      if (isUnorderedList || isOrderedList) {
        if (paraLineStart - 1 > paraStart) {
          addParagraph(paraStart, paraLineStart - 1);
        }
        let childMdArray;
        [childMdArray, iter] = this.parseSection(
          text,
          iter,
          headingLevel,
          curIndent + 1,
        );
        childMdArray = ['-', childMdArray];
        // lists are encapsuled
        const capsule = (isUnorderedList) ? 'ul' : 'ol';
        if (!mdArray.length || mdArray[mdArray.length - 1][0] !== capsule) {
          mdArray.push([capsule, [childMdArray]]);
        }
        else {
          mdArray[mdArray.length - 1][1].push(childMdArray);
        }
        paraStart = iter;
        continue;
      }

      /*
       * quotes
       */
      if (chr === '>' || chr === '<') {
        if (paraLineStart - 1 > paraStart) {
          addParagraph(paraStart, paraLineStart - 1);
        }
        const [qArray, newIter] = this.parseQuote(text, iter);
        mdArray.push(qArray);
        iter = newIter;
        paraStart = iter;
        continue;
      }

      /*
       * code block
       */
      if (text.startsWith('```', iter)) {
        if (paraLineStart - 1 > paraStart) {
          addParagraph(paraStart, paraLineStart - 1);
        }
        const [cbArray, newIter] = this.parseCodeBlock(text, iter + 3);
        mdArray.push(cbArray);
        iter = newIter;
        paraStart = iter;
        continue;
      }

      /* other stopping conditions */
      if (!indent && MarkdownParser.stoppingCondition(text, iter)) {
        // encountered something - save paragraph
        if (paraLineStart - 1 > paraStart) {
          addParagraph(paraStart, paraLineStart - 1);
        }
        const chr = text[iter];
        if (chr === '\n') {
          iter = this.skipSpaces(text, iter + 1);
          if (text[iter] === '\n') {
            if (headingLevel && this.newlineBreaksArticles) {
              break;
            }
            iter += 1;
          }
        } else if (chr === '#') {
          break;
        }
        paraStart = iter;
        continue;
      }
      // rest of line
      const [pPArray, newIter] = this.parseParagraph(text, iter);
      if (pPArray) {
        pArray = pArray.concat(pPArray);
      }
      iter = newIter;
    }

    return [mdArray, iter];
  }

  /*
   * go to character in line
   * return position of character or null if not found before next line
   */
  goToCharInLine(text, start, chr) {
    let iter = start;
    for (;iter < text.length && text[iter] !== '\n' && text[iter] !== chr; iter += 1) {}
    if (text[iter] === chr) {
      return iter;
    }
    return null;
  }

  /*
   * Parse Paragraph till next newline
   */
  parseParagraph(text, start) {
    const pArray = [];
    let iter = start;
    let pStart = start;
    let pEnd = 0;
    for (;iter < text.length && text[iter] !== '\n'; iter += 1) {
      let newElem = null;
      if (text[iter] === '`') {
        const pos = this.goToCharInLine(text, iter + 1, '`');
        if (pos) {
          newElem = ['c', text.slice(iter + 1, pos)];
          pEnd = iter;
          iter = pos;
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
        pStart = iter + 1;
        pEnd = 0;
        pArray.push(newElem);
      }
    }
    iter += 1;
    if (pStart !== iter) {
      pArray.push(text.slice(pStart, iter));
    }
    return [pArray, iter];
  }

  /*
   * get indentation of line
   * @param text
   * @param start integer position of line start of indent to check
   * @return integer of indentation
   */
  getIndent(text: string, start: number) {
    let iter = start;
    let indent = 0;
    while (iter < text.length) {
      const chr = text[iter];
      if (chr === '\t') {
        indent += this.tabWidth;
      } else if (chr === ' ') {
        indent += 1;
      } else {
        break;
      }
      iter += 1;
    }
    return [indent, iter];
  }

  /*
   * parse Code Block
   * start is first character after the initializing ```
   * we just parse till the ending occures
   */
  parseCodeBlock(text, start) {
    let iter = this.skipSpaces(text, start, false);
    if (text[iter] === '\n') {
      iter += 1;
    }
    const cbStart = iter;
    while (true) {
      if (iter >= text.length) {
        return [['cb', text.slice(cbStart)], iter];
      }
      iter = this.skipSpaces(text, iter, true);
      if (text.startsWith('```', iter)) {
        const nextIter = iter + 3;
        return [['cb', text.slice(cbStart, iter)], nextIter];
      }
      for (;iter < text.length && text[iter] !== '\n'; iter += 1) {}
    }
  }

  /*
   * parse quote
   */
  parseQuote(text, start) {
    // either '<' or '>'
    const quoteChar = text[start];
    let iter = start;
    let quoteText = '';
    while(true) {
      if (iter >= text.length || text[iter] !== quoteChar) {
        break;
      }
      iter += 1;
      const startLine = iter;
      for (;iter < text.length && text[iter] !== '\n'; iter += 1) {}
      iter += 1;
      quoteText += text.slice(startLine, iter);
    }
    return [[quoteChar, this.parseText(quoteText, 0, 0)[0]], iter];
  }

  skipSpaces(text: string, start: number, skipNewlines = false) {
    let iter = start;
    for (;iter < text.length; iter += 1) {
      const char = text[iter];
      if (char !== ' ' && char !== '\t' && (!skipNewlines || char !== '\n')) {
        break;
      }
    }
    return iter;
  }
}
