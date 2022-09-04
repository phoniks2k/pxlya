import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

import { MarkdownParagraph } from './Markdown';
import {
  colorFromText,
  setBrightness,
  getDateTimeString,
} from '../core/utils';
import { parseParagraph } from '../core/MarkdownParser';


const selectStyle = (state) => state.gui.style.indexOf('dark') !== -1;

function ChatMessage({
  name,
  uid,
  country,
  msg,
  ts,
  openCm,
}) {
  const isDarkMode = useSelector(
    selectStyle,
  );
  const refEmbed = useRef();

  const isInfo = (name === 'info');
  const isEvent = (name === 'event');
  let className = 'msg';
  if (isInfo) {
    className += ' info';
  } else if (isEvent) {
    className += ' event';
  } else if (msg.charAt(0) === '>') {
    className += ' greentext';
  } else if (msg.charAt(0) === '<') {
    className += ' redtext';
  }

  console.log('RENDER MESSAGE');

  const pArray = parseParagraph(msg);

  return (
    <li className="chatmsg" ref={refEmbed}>
      <div className="msgcont">
        <span className={className}>
          {(!isInfo && !isEvent) && (
            <React.Fragment key="name">
              <img
                className="chatflag"
                alt=""
                title={country}
                src={`/cf/${country}.gif`}
              />
              <span
                className="chatname"
                style={{
                  color: setBrightness(colorFromText(name), isDarkMode),
                  cursor: 'pointer',
                }}
                role="button"
                title={name}
                tabIndex={-1}
                onClick={(event) => {
                  openCm(event.clientX, event.clientY, name, uid);
                }}
              >
                {name}
              </span>
              {': '}
            </React.Fragment>
          )}
          <MarkdownParagraph refEmbed={refEmbed} pArray={pArray} />
        </span>
        <span className="chatts">
          {getDateTimeString(ts)}
        </span>
      </div>
    </li>
  );
}

export default React.memo(ChatMessage);
