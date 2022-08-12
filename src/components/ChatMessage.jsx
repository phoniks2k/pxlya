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
    <li className="chatmsg">
      {(!isInfo && !isEvent)
        && (
          <div className="chathead" key="ch">
            <span className="chatname">
              <img
                alt=""
                title={country}
                src={`${window.ssv.assetserver}/cf/${country}.gif`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = './cf/xx.gif';
                }}
              />
              &nbsp;
              <span
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
              </span>:
            </span>
            <span className="chatts">
              {getDateTimeString(ts)}
            </span>
          </div>
        )}
      <div className={className} key="cm">
        <MarkdownParagraph refEmbed={refEmbed} pArray={pArray} />
      </div>
      <div className="chatembed" ref={refEmbed} key="ce" />
    </li>
  );
}

export default React.memo(ChatMessage);
