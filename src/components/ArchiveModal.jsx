/*
 * @flow
 */

/* eslint-disable max-len */

import React from 'react';
import { t } from 'ttag';

const imageStyle = {
  maxWidth: '20%',
  padding: 2,
  display: 'inline-block',
  verticalAlign: 'middle',
};

const ArchiveModal = () => (
  <p style={{ textAlign: 'center', paddingLeft: '5%', paddingRight: '5%' }}>
    <p className="modaltext">
      {t`While we tend to not delete canvases, some canvases are started for fun or as a request by users who currently like a meme. \
Those canvases can get boring after a while and after weeks of no major change and if they really aren&apos;t worth being kept active, we decide to remove them.`}<br />
      {t`Here we collect those canvases to archive them in a proper way (which is currently just one).`}
    </p>
    <p className="modaltitle">{t`Political Compass Canvas`}</p>
    <img
      style={imageStyle}
      alt="political-compass"
      src="https://storage.pixelplanet.fun/compass-preview.png"
    />
    <p className="modaltext">
      {t`This canvas got requested during a time of political conflicts on the main Earth canvas. It was a 1024x1024 representation of the political compass with a 5s coolodwn and 60s stacking. It got launched on May 11th and remained active for months till it got shut down on November 30th.`}<br />
      {t`We decided to archive it as a timelapse with lossless encoded webm. Taking a screenshot from the timelapse results in a perfect 1:1 representation of how the canvas was at that time.`}
    </p>
    <p>
      Timelapse:
      <a href="https://storage.pixelplanet.fun/compass-timelapse.webm">
        Download
      </a>
    </p>
    <img
      style={{ padding: 2, maxWidth: '80%', verticalAlign: 'middle' }}
      alt="political-compass"
      src="https://storage.pixelplanet.fun/compass-final.png"
    />
  </p>
);

const data = {
  content: ArchiveModal,
  title: t`Canvas Archive`,
};

export default data;
