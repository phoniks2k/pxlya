import React, { useState, useEffect, useRef } from 'react';

import usePostMessage from '../hooks/postMessage';

const urlStr = 't.me/';

function getUserPostFromUrl(url) {
  let aPos = url.indexOf(urlStr);
  if (aPos === -1) {
    return url;
  }
  aPos += urlStr.length;
  if (aPos >= url.length) {
    return url;
  }
  let bPos = url.indexOf('/', aPos);
  if (bPos === -1) {
    bPos = url.length;
    return url.substring(aPos);
  }
  const user = url.substring(aPos, bPos);
  bPos += 1;
  if (bPos >= url.length) {
    return user;
  }
  aPos = url.indexOf('/', bPos);
  if (aPos === -1) {
    aPos = url.length;
  }
  const post = url.substring(bPos, aPos);
  return `${user} | ${post}`;
}

const Telegram = ({ url }) => {
  const [frameHeight, setFrameHeight] = useState(200);
  const iFrameRef = useRef(null);

  usePostMessage(iFrameRef,
    (data) => {
      try {
        const pdata = JSON.parse(data);
        if (pdata.event === 'resize') {
          if (pdata.height) {
            setFrameHeight(pdata.height);
          }
        }
      } catch {
        console.error(`Could not read postMessage from frame: ${data}`);
      }
    },
  );

  const userPost = url.substring(url.indexOf(urlStr) + urlStr.length)
  const embedCode =
    // eslint-disable-next-line max-len
    `<script async src="https://telegram.org/js/telegram-widget.js?18" data-telegram-post="${userPost}" data-width="100%"></script>`;

//      srcDoc={embedCode}
  return (
    <iframe
      ref={iFrameRef}
      style={{
        width: '100%',
        height: frameHeight,
      }}
      src={`https://t.me/${userPost}?embed=1`}
      frameBorder="0"
      referrerPolicy="no-referrer"
      allow="autoplay; picture-in-picture"
      scrolling="no"
      // eslint-disable-next-line max-len
      sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-presentation"
      allowFullScreen
      title="Embedded telegram"
    />
  );
};

export default [
  React.memo(Telegram),
  (url) => url.includes(urlStr),
  (url) => getUserPostFromUrl(url),
  `${window.ssv.assetserver}/embico/telegram.png`,
];
