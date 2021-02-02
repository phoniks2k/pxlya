/*
 *
 * @flow
 */
import React from 'react';
import { connect } from 'react-redux';

import { showContextMenu } from '../actions';
import { colorFromText, setBrightness } from '../core/utils';


function ChatMessage({
  name,
  uid,
  country,
  msgArray,
  openUserContextMenu,
  darkMode,
}) {
  if (!name || !msgArray) {
    return null;
  }

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
              color: setBrightness(colorFromText(name), darkMode),
              cursor: 'pointer',
            }}
            role="button"
            tabIndex={-1}
            onClick={(event) => {
              const {
                clientX,
                clientY,
              } = event;
              openUserContextMenu(
                clientX,
                clientY,
                uid,
                name,
              );
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
                  color: setBrightness(colorFromText(txt.substr(1)), darkMode),
                }}
              >{txt}</span>
            );
          } if (type === 'm') {
            return (
              <span
                className="mention"
                style={{
                  color: setBrightness(colorFromText(txt.substr(1)), darkMode),
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

function mapStateToProps(state: State) {
  const { style } = state.gui;
  const darkMode = style.indexOf('dark') !== -1;
  return { darkMode };
}

function mapDispatchToProps(dispatch) {
  return {
    openUserContextMenu(xPos, yPos, uid, name) {
      dispatch(showContextMenu('USER', xPos, yPos, {
        uid,
        name,
      }));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatMessage);
