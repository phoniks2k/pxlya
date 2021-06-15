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
  }

  parseText(text: string, level = 0, start = 0) {
    let mdArray = [];
    let iter = start;
    while (iter < text.length) {
      const [aMdArray, newIter] = this.parseArticle(text, iter, level);
      iter = newIter;
      mdArray = mdArray.concat(aMdArray);
      // either heading hit or article end
      if (text[iter] === '#') {
        let subLvl = 0;
        for (;iter + subLvl <= text.length && text[iter + subLvl] === '#'; subLvl += 1) {}
        if (subLvl <= level || level === 6) {
          // end of article
          // encountered title with same level or lower
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

  stoppingCondition(text: string, iter: number) {
    const chr = text[iter];
    if (chr === '\n'
      || chr === '#'
      || (chr === '`' && text[iter + 1] === '`' && text[iter + 2] === '`')
    ) {
      return true;
    }
    return false;
  }

  /*
   * parses Articles (contains paragraphs, code-blocks, numeration, etc.)
   * returns when encountering heading of level or lower (iter is at # position)
   *   or heading-cancel with three spaces (iter is past newlines)
   */
  parseArticle(text: string, start: number, level = 0) {
    let iter = start;
    const mdArray = [];
    let paraStart = iter;

    while (true) {
      if (iter >= text.length) {
        if (paraStart < text.length) {
          mdArray.push(['p', text.slice(paraStart)]);
        }
        break;
      }
      // beginning of line
      const paraLineStart = iter;
      iter = this.skipSpaces(text, iter);
      if (stoppingCondition(text, iter)) {
        const chr = text[iter];
        // encountered something - save paragraph
        if (paraLineStart - 1 > paraStart) {
          mdArray.push(['p', text.slice(paraStart, paraLineStart - 1)]);
        }
        if (chr === '\n') {
          iter = this.skipSpaces(text, iter + 1);
          if (text[iter] === '\n') {
            if (level > 0 && this.newlineBreaksArticles) {
              break;
            }
            iter += 1;
          }
        } else if (chr === '#') {
          break;
        } else if (chr === '`') {
          // code block
          const [cbArray, newIter] = this.parseCodeBlock(text, iter + 3);
          mdArray.push(cbArray);
          iter = newIter;
        }
        paraStart = iter;
        continue;
      }
      // rest of line
      for (;iter < text.length && text[iter] !== '\n'; iter += 1) {}
      iter += 1;
    }

    return [mdArray, iter];
  }

  /*
   * parse Code Block
   * start is first character after the initializing ```
   * we just parse till the ending occures
   */
  parseCodeBlock(text: string, start: number) {
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
        const nextIter = this.skipSpaces(text, iter + 3, true);
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
