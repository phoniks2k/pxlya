/*
 *
 * @flow
 */
import React from 'react';
import { useDispatch } from 'react-redux';

import { showContextMenu } from '../actions';
import { colorFromText, setBrightness } from '../core/utils';


function ChatMessage({
  name,
  uid,
  country,
  dark,
  windowId,
  msgArray,
}) {
  if (!name || !msgArray) {
    return null;
  }

  const dispatch = useDispatch();

  const isInfo = (name === 'info');
  const isEvent = (name === 'event');
  let className = 'msg';
  if (isInfo) {
    className += ' info';
  } else if (isEvent) {
    className += ' event';
  } else if (msgArray[0][1].charAt(0) === '>') {
    className += ' greentext';
  }

  return (
    <p className="chatmsg">
      {
        (!isInfo && !isEvent)
        && (
        <span>
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
            className="chatname"
            style={{
              color: setBrightness(colorFromText(name), dark),
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
          :&nbsp;
        </span>
        )
      }
      {
        msgArray.map((msgPart) => {
          const [type, txt] = msgPart;
          if (type === 't') {
            return (<span className={className}>{txt}</span>);
          } if (type === 'c') {
            return (<a href={`./${txt}`}>{txt}</a>);
          } if (type === 'l') {
            return (
              <a
                href={txt}
                target="_blank"
                rel="noopener noreferrer"
              >{txt}</a>
            );
          } if (type === 'p') {
            return (
              <span
                className="ping"
                style={{
                  color: setBrightness(colorFromText(txt.substr(1)), dark),
                }}
              >{txt}</span>
            );
          } if (type === 'm') {
            return (
              <span
                className="mention"
                style={{
                  color: setBrightness(colorFromText(txt.substr(1)), dark),
                }}
              >{txt}</span>
            );
          }
          return null;
        })
      }
    </p>
  );
}

export default React.memo(ChatMessage);
