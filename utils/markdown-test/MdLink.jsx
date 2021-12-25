/*
 * Renders a markdown link
 * Also provides previews
 * Links are assumed to start with protocol (http:// etc.)
 */
import React from 'react';

/*
 * gets a descriptive text of the domain of the link
 * Example:
 *  https://www.youtube.com/watch?v=G8APgeFfkAk returns 'youtube'
 *  http://www.google.at returns 'google.at'
 *  (www. and .com are split)
 */
function getLinkDesc(link) {
  let domainStart = link.indexOf('://') + 3;
  if (domainStart < 3) {
    domainStart = 0;
  }
  if (link.startsWith('www.', domainStart)) {
    domainStart += 4;
  }
  let domainEnd = link.indexOf('/', domainStart);
  if (domainEnd === -1) {
    domainEnd = link.length;
  }
  if (link.endsWith('.com', domainEnd)) {
    domainEnd -= 4;
  }
  if (domainEnd <= domainStart) {
    return link;
  }
  return link.slice(domainStart, domainEnd);
}

/*
 * try to get extension out of link
 */
function getExt(link) {
  let paramStart = link.indexOf('&');
  if (paramStart === -1) {
    paramStart = link.length;
  }
  let posDot = paramStart - 1;
  for (;posDot >= 0 && link[posDot] !== '.'; posDot -= 1) {
    if (link[posDot] === '/') {
      return null;
    }
  }
  if (paramStart - posDot > 4) {
    return null;
  }
  return link.slice(posDot, paramStart);
}

const MdLink = ({ href, title, type }) => {
  const desc = getLinkDesc(href);
  <div className="link">
};

export default Reace.memo(MdLink);
