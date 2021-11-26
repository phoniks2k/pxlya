/*
 * Markdown parsing
 *
 * we do not support all markdown, but do additionally parse extra
 * stuff like pixelplanet coords and usernames and bare links
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
    this.keepQuoteArrows = opt && opt.keepQuoteArrows || true;
  }

  parse(text: string) {
    return this.parseText(text, 0, 0, '')[0];
  }

  parseText(text, headingLevel, start, quoteLevel) {
    let mdArray = [];
    let iter = start;
    while (iter < text.length) {
      const [aMdArray, newIter, breaking] = this.parseSection(
        text, iter, headingLevel, quoteLevel,
      );
      iter = newIter;
      mdArray = mdArray.concat(aMdArray);
      if (breaking) {
        break;
      }
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
            text, subLvl, lineEnd + 1, quoteLevel,
          );
          mdArray.push(['a', subLvl, title, subMdArray]);
          iter = newIter;
        }
      } else if (chr === '>' || chr === '<') {
        // child quote
        const [subMdArray, newIter] = this.parseText(
          text, 0, iter - quoteLevel.length, quoteLevel + chr,
        );
        mdArray.push([chr, subMdArray]);
        iter = newIter;
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
    quoteLevel = '',
    indent = 0,
  ) {
    let iter = start;
    /*
     * breaking is currently only used when
     * end of quote block is reached
     */
    let breaking = false;
    const mdArray = [];
    let paraStart = iter;
    let lineNr = 0;

    const  addParagraph = (start, end) => {
      let paraText = text.slice(start, end);
      if (!this.keepQuoteArrows && quoteLevel) {
        paraText = paraText.split('\n')
          .map((t) => t.trim().slice(quoteLevel.length))
          .join('\n');
      }
      mdArray.push(['p', paraText]);
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
       * break when in or out of quote levels
       */
      if (!indent || lineNr > 1) {
        if (text.startsWith(quoteLevel, iter)) {
          iter += quoteLevel.length;
          const chr = text[iter];
          if (chr === '>' || chr === '<') {
            if (iter - 1 > paraStart) {
              addParagraph(paraStart, iter - quoteLevel.length - 1);
            }
            break;
          }
        }
        else {
          // quote ended aka less deep quotelevel
          if (iter - 1 > paraStart) {
            addParagraph(paraStart, iter - 1);
          }
          breaking = true;
          break;
        }
      } else {
        iter += quoteLevel.length;
      }

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

      if (chr === '-') {
        if (paraLineStart - 1 > paraStart) {
          addParagraph(paraStart, paraLineStart - 1);
        }
        let childMdArray;
        [childMdArray, iter, breaking] = this.parseSection(
          text,
          iter + 1,
          headingLevel,
          quoteLevel,
          curIndent + 1,
        );
        childMdArray = ['-', childMdArray];
        // lists are encapsuled by 'ul'
        if (!mdArray.length || mdArray[mdArray.length - 1][0] !== 'ul') {
          mdArray.push(['ul', [childMdArray]]);
        }
        else {
          mdArray[mdArray.length - 1][1].push(childMdArray);
        }
        if (breaking) {
          return [mdArray, iter, breaking];
        }
        paraStart = iter;
        continue;
      }

      /*
       * code block
       */
      if (chr === '`' && text[iter + 1] === '`' && text[iter + 2] === '`') {
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
      for (;iter < text.length && text[iter] !== '\n'; iter += 1) {}
      iter += 1;
    }

    return [mdArray, iter, breaking];
  }

  parseList(text: string, start: number) {
    const iter = start;
    const mdArray = [];
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
    const cbStart = this.skipSpaces(text, start, true);
    let iter = cbStart;
    while (true) {
      if (iter >= text.length) {
        return [['cb', text.slice(cbStart)], iter];
      }
      iter = this.skipSpaces(text, iter, true);
      if (text[iter] === '`'
        && text[iter + 1] === '`'
        && text[iter + 2] === '`'
      ) {
        const nextIter = iter + 3;
        return [['cb', text.slice(cbStart, iter)], nextIter];
      }
      for (;iter < text.length && text[iter] !== '\n'; iter += 1) {}
    }
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

  parseIndents(text: string) {
    const lines = text.split('\n');
    const indents = [];
    const { tabWidth } = this;

    /*
     * Get indentation of lines
     * @param text: string of text to parse
     * @return [indents, lines]:
     *   indents: Array of normalized numerical indents
     *   lines: Array of trimmed lines
     */
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      let indent = 0;
      for (let c = 0; c < line.length; c += 1) {
        const chr = line[c];
        if (chr === '\t') {
          indent += this.tabWidth;
        } else if (chr === ' ') {
          indent += 1;
        } else {
          break;
        }
      }
      lines[i] = line.trim();
      indents.push(indent);
    }

    // normalize
    let min = indents[0];
    let max = indents[0];
    for (let m = 0; m < indents.length; m += 1) {
      const indent = indents[m];
      if (indent < min) min = indent;
      if (indent > max) max = indent;
    }
    let cnt = 0;
    console.log(min, max);
    for (let n = min; n <= max; n += 1) {
      let available = false;
      for (let c = 0; c < indents.length; c += 1) {
        if (indents[c] === n) {
          if (!available) available = true;
          indents[c] = cnt;
        }
      }
      if (available) cnt += 1;
    }

    console.log(lines);
    console.log(indents);
  }
}
