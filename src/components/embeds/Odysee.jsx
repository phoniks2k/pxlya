/*
 * Odysee oembed API does not allow CORS request,
 * therefor we can't use it right now.
 * Still keeping this here in case that the policy changes in the future
 */
import React, { useState, useEffect } from 'react';

function getUserFromUrl(url) {
  let aPos = url.indexOf('/@');
  if (aPos === -1) {
    return url;
  }
  aPos += 1;
  let bPos = url.indexOf(':', aPos);
  if (bPos === -1) {
    bPos = url.length;
  }
  return url.substring(aPos, bPos);
}

const Odysee = ({ url }) => {
  const [embedUrl, setEmbedUrl] = useState(null);

  useEffect(async () => {
    const prot = window.location.protocol.startsWith('http')
      ? window.location.protocol : 'https';
    // eslint-disable-next-line max-len
    const odurl = `${prot}//odysee.com/$/oembed?url=${encodeURIComponent(url)}&format=json`;
    const resp = await fetch(odurl);
    const embedData = await resp.json();
    if (embedData.html) {
      const { html } = embedData;
      let emUrl = html.substring(html.indexOf('src="') + 5);
      emUrl = emUrl.substring(0, emUrl.indexOf('"'));
      setEmbedUrl(emUrl);
    }
  }, []);

  if (!embedUrl) {
    return <div>LOADING</div>;
  }

  return (
    <div className="vemb" style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="vembc"
        src={embedUrl}
        frameBorder="0"
        referrerPolicy="no-referrer"
        allow="autoplay; picture-in-picture"
        scrolling="no"
        // eslint-disable-next-line max-len
        sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-presentation"
        allowFullScreen
        title="Embedded odysee"
      />
    </div>
  );
};

export default [
  React.memo(Odysee),
  (url) => url.indexOf('a') !== -1 && url.indexOf('/', url.indexOf('@')) !== -1,
  (url) => getUserFromUrl(url),
  `${window.ssv.assetserver}/embico/odysee.png`,
];
