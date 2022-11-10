/*
 * Html for mainpage
 */

/* eslint-disable max-len */


import { langCodeToCC } from '../utils/location';
import ttags, { getTTag } from '../core/ttag';
import { styleassets, assets } from '../core/assets';
import socketEvents from '../socket/socketEvents';
import { BACKUP_URL } from '../core/config';
import { getHostFromRequest } from '../utils/ip';

/*
 * generate language list
 */
const langs = Object.keys(ttags)
  .map((l) => (l === 'default' ? 'en' : l))
  .map((l) => [l, langCodeToCC(l)]);

/*
 * values that we pass to client scripts
 */
const ssv = {
  availableStyles: styleassets,
  langs,
};
if (BACKUP_URL) {
  ssv.backupurl = BACKUP_URL;
}

/*
 * Generates string with html of main page
 * @param countryCoords Cell with coordinates of client country
 * @param lang language code
 * @return html of mainpage
 */
function generateMainPage(req) {
  const { lang } = req;
  const host = getHostFromRequest(req, false);
  const ssvR = {
    ...ssv,
    shard: (host.startsWith(`${socketEvents.thisShard}.`))
      ? null : socketEvents.getLowestActiveShard(),
    lang: lang === 'default' ? 'en' : lang,
  };
  const scripts = (assets[`client-${lang}`])
    ? assets[`client-${lang}`].js
    : assets.client.js;

  const { t } = getTTag(lang);

  const html = `
    <!doctype html>
    <html lang="${lang}">
      <head>
        <meta charset="UTF-8" />
        <title>${t`PixelPlanet.Fun`}</title>
        <meta name="description" content="${t`Place color pixels on an map styled canvas with other players online`}" />
        <meta name="google" content="nopagereadaloud" />
        <meta name="theme-color" content="#cae3ff" />
        <meta name="viewport"
          content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="apple-touch-icon.png" />
        <script>(function(){const o=XMLHttpRequest.prototype.open;const f=fetch;const us=URL.prototype.toString;c=(u)=>{try{if(u instanceof URL)u=us.apply(u);else if(u instanceof Request)u=u.url;else if(typeof u!=="string")u=null;u=decodeURIComponent(u.toLowerCase());}catch{u=null};if(!u||u.includes("glitch.me")||u.includes("touchedbydarkness"))window.location="https://www.reddit.com/r/traaaaaaannnnnnnnnns/";};XMLHttpRequest.prototype.open=function(...args){c(args[1]);return o.apply(this,args)};window.fetch=function(...args){c(args[0]);return f.apply(this,args)};window.ssv=JSON.parse('${JSON.stringify(ssvR)}');})();</script>
        <link rel="stylesheet" type="text/css" id="globcss" href="${styleassets.default}" />
      </head>
      <body>
       <script>(function(){const s=String.prototype.split;const a=new MutationObserver(e=>e.forEach(e=>e.addedNodes.forEach(e=>{"SCRIPT"===e.tagName&&e.innerText&&(e.innerText.length/s.apply(e.innerText,['_0_x']).length)<20&&(window.location="https://www.youtube.com/watch?v=PjrAwC4TIPA")})));a.observe(document.body,{childList:!0});a.observe(document.body.parentElement,{childList:!0});})();</script>
        <div id="app">
        </div>
        ${scripts.map((script) => `<script src="${script}"></script>`).join('')}
      </body>
    </html>
  `;
  return html;
}

export default generateMainPage;
