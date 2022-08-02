import fs from 'fs';
import readline from 'readline';

import { PIXELLOGGER_PREFIX } from './logger';
import { getNamesToIds } from '../data/sql/RegUser';
import { getIdsToIps, getIPofIID } from '../data/sql/IPInfo';
import { getIPv6Subnet } from '../utils/ip';


function parseFile(cb) {
  const date = new Date();
  const year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  let day = date.getUTCDate();
  if (day < 10) day = `0${day}`;
  if (month < 10) month = `0${month}`;
  const filename = `${PIXELLOGGER_PREFIX}${year}-${month}-${day}.log`;

  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filename);

    const rl = readline.createInterface({
      input: fileStream,
    });

    rl.on('line', (line) => cb(line.split(' ')));

    rl.on('error', (err) => {
      reject(err);
    });

    rl.on('close', () => {
      resolve();
    });
  });
}

/*
 * Get summary of users placing in area of current day
 * @param canvasId id of canvas
 * @param xUL, yUL, xBR, yBR area of canvs
 * @param time timestamp of when to start
 * @param iid Limit on one user (optional)
 * @return array of parsed pixel log lines
 *         string if error
 */
export async function getSummaryFromArea(
  canvasId,
  xUL,
  yUL,
  xBR,
  yBR,
  time,
  iid,
) {
  const ips = {};
  const uids = [];
  let filterIP = null;
  if (iid) {
    filterIP = await getIPofIID(iid);
    if (!filterIP) {
      return 'Could not resolve IID to IP';
    }
  }
  try {
    await parseFile((parts) => {
      const [ts, ipFull, uid, cid, x, y,, clr] = parts;
      // eslint-disable-next-line eqeqeq
      if (canvasId == cid
        && ts >= time
        && x >= xUL
        && x <= xBR
        && y >= yUL
        && y <= yBR
      ) {
        const ip = getIPv6Subnet(ipFull);
        if (filterIP && ip !== filterIP) {
          return;
        }
        let curVals = ips[ip];
        if (!curVals) {
          curVals = [0, ip, uid, 0, 0, 0, 0];
          ips[ip] = curVals;
          uids.push(uid);
        }
        curVals[0] += 1;
        curVals[3] = x;
        curVals[4] = y;
        curVals[5] = clr;
        curVals[6] = ts;
      }
    });
  } catch (err) {
    return `Could not parse logfile: ${err.message}`;
  }

  const uid2Name = await getNamesToIds(uids);

  const ipKeys = Object.keys(ips);
  const ip2Id = await getIdsToIps(ipKeys);

  const rows = [];
  for (let i = 0; i < ipKeys.length; i += 1) {
    const [pxls, ip, uid, x, y, clr, ts] = ips[ipKeys[i]];
    const userMd = (uid && uid2Name[uid])
      ? `@[${uid2Name[uid]}](${uid})` : 'N/A';
    rows.push([
      pxls,
      ip2Id[ip] || 'N/A',
      userMd,
      `#d,${x},${y}`,
      clr,
      ts,
    ]);
  }

  return rows;
}


export async function getPixelsFromArea(
  canvasId,
  xUL,
  yUL,
  xBR,
  yBR,
  time,
  iid,
  maxRows = 300,
) {
  const pixels = [];
  const uids = [];
  const ips = [];
  let filterIP = null;
  if (iid) {
    filterIP = await getIPofIID(iid);
    if (!filterIP) {
      return 'Could not resolve IID to IP';
    }
  }
  try {
    await parseFile((parts) => {
      const [ts, ipFull, uid, cid, x, y,, clr] = parts;
      // eslint-disable-next-line eqeqeq
      if (canvasId == cid
        && ts >= time
        && x >= xUL
        && x <= xBR
        && y >= yUL
        && y <= yBR
      ) {
        const ip = getIPv6Subnet(ipFull);
        if (filterIP && ip !== filterIP) {
          return;
        }
        pixels.push([ip, uid, x, y, clr, ts]);
        if (!ips.includes(ip)) {
          ips.push(ip);
          uids.push(uid);
        }
      }
    });
  } catch (err) {
    return `Could not parse logfile: ${err.message}`;
  }

  const uid2Name = await getNamesToIds(uids);
  const ip2Id = await getIdsToIps(ips);

  const pixelF = (pixels.length > 300) ? pixels.slice(maxRows * -1) : pixels;

  const rows = [];
  for (let i = 0; i < pixelF.length; i += 1) {
    const [ip, uid, x, y, clr, ts] = pixelF[i];
    const userMd = (uid && uid2Name[uid])
      ? `@[${uid2Name[uid]}](${uid})` : 'N/A';
    const id = ip2Id[ip] || 'N/A';
    rows.push([
      id,
      userMd,
      `#d,${x},${y}`,
      clr,
      ts,
    ]);
  }

  return rows;
}
