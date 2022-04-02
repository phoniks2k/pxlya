import React, { useState, useEffect } from 'react';

const Twitter = ({ url }) => {
  const [embedCode, setEmbedCode] = useState(null);

  useEffect(async () => {
    const prot = window.location.protocol.startsWith('http')
      ? window.location.protocol : 'https';
    // eslint-disable-next-line max-len
    const tkurl = `${prot}//publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
    const resp = await fetch(tkurl);
    const embedData = await resp.json();
    if (embedData.html) {
      setEmbedCode(embedData.html);
    }
  }, []);

  if (!embedCode) {
    return <div>LOADING</div>;
  }

  return (
    <iframe
      style={{
        width: '100%',
        height: 756,
      }}
      srcDoc={embedCode}
      frameBorder="0"
      referrerPolicy="no-referrer"
      allow="autoplay; picture-in-picture"
      scrolling="no"
      // eslint-disable-next-line max-len
      sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-presentation"
      allowFullScreen
      title="Embedded tiktok"
    />
  );
};

export default [
  React.memo(Twitter),
  (url) => url.includes('/status/'),
  (url) => url,
  `${window.ssv.assetserver}/embico/twitter.png`,
];
