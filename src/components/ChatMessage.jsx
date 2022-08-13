import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { showContextMenu } from '../store/actions';
import { MarkdownParagraph } from './Markdown';
import {
  colorFromText,
  setBrightness,
  getDateTimeString,
} from '../core/utils';
import { parseParagraph } from '../core/MarkdownParser';


function ChatMessage({
  name,
  uid,
  country,
  windowId,
  msg,
  ts,
}) {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(
    (state) => state.gui.style.indexOf('dark') !== -1,
  );
  const refEmbed = useRef(null);

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

  const pArray = parseParagraph(msg);

  return (
    <li className="chatmsg" ref={refEmbed}>
      <div className="msgcont">
        <span className={className}>
          {(!isInfo && !isEvent) && (
            <span key="name">
              <img
                alt=""
                title={country}
                src={`${window.ssv.assetserver}/cf/${country}.gif`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = './cf/xx.gif';
                }}
              />
              <span
                className="chatname"
                style={{
                  color: setBrightness(colorFromText(name), isDarkMode),
                  cursor: 'pointer',
                }}
                role="button"
                tabIndex={-1}
                onClick={(event) => {
                  const {
                    clientX,
                    clientY,
                  } = event;
                  dispatch(showContextMenu('USER', clientX, clientY, {
                    windowId,
                    uid,
                    name,
                  }));
                }}
              >
                {name}
              </span>
              {': '}
            </span>
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
