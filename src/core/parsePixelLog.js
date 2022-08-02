import fs from 'fs';
import readline from 'readline';

import { PIXELLOGGER_PREFIX } from './logger';
import { getNamesToIds } from '../data/sql/RegUser';
import {
  getIdsToIps,
  getInfoToIps,
  getIPofIID,
} from '../data/sql/IPInfo';
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
      const [tsStr, ipFull, uidStr, cid, x, y,, clrStr] = parts;
      const ts = parseInt(tsStr, 10);
      if (ts >= time
        // eslint-disable-next-line eqeqeq
        && canvasId == cid
        && x >= xUL
        && x <= xBR
        && y >= yUL
        && y <= yBR
      ) {
        const ip = getIPv6Subnet(ipFull);
        if (filterIP && ip !== filterIP) {
          return;
        }
        const clr = parseInt(clrStr, 10);
        const uid = parseInt(uidStr, 10);
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
  const ip2Info = await getInfoToIps(ipKeys);

  let printIIDs = false;
  let printUsers = false;
  const columns = ['rid', '#'];
  const types = ['number', 'number'];
  if (ip2Info.size > 0) {
    printIIDs = true;
    columns.push('IID', 'ct', 'cidr', 'org', 'pc');
    types.push('uuid', 'flag', 'string', 'string', 'string');
  }
  if (uid2Name.size > 0) {
    printUsers = true;
    columns.push('User');
    types.push('user');
  }
  columns.push('last', 'clr', 'time');
  types.push('coord', 'clr', 'ts');

  const rows = [];
  for (let i = 0; i < ipKeys.length; i += 1) {
    const [pxls, ip, uid, x, y, clr, ts] = ips[ipKeys[i]];
    const row = [i, pxls];
    if (printIIDs) {
      const ipInfo = ip2Info.get(ip);
      if (!ipInfo) {
        row.push('N/A', 'xx', 'N/A', 'N/A', 'N/A');
      } else {
        let { pcheck } = ipInfo;
        if (pcheck) {
          const seperator = pcheck.indexOf(',');
          if (seperator !== -1) {
            pcheck = pcheck.slice(0, seperator);
          }
        }
        row.push(
          ipInfo.uuid || 'N/A',
          ipInfo.country || 'xx',
          ipInfo.cidr || 'N/A',
          ipInfo.org || 'N/A',
          pcheck || 'N/A',
        );
      }
    }
    if (printUsers) {
      const userMd = (uid && uid2Name.has(uid))
        ? `${uid2Name.get(uid)},${uid}` : 'N/A';
      row.push(userMd);
    }
    row.push(`${x},${y}`, clr, ts);
    rows.push(row);
  }

  return {
    columns,
    types,
    rows,
  };
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
      const [tsStr, ipFull, uidStr, cid, x, y,, clrStr] = parts;
      const ts = parseInt(tsStr, 10);
      if (ts >= time
        // eslint-disable-next-line eqeqeq
        && canvasId == cid
        && x >= xUL
        && x <= xBR
        && y >= yUL
        && y <= yBR
      ) {
        const ip = getIPv6Subnet(ipFull);
        if (filterIP && ip !== filterIP) {
          return;
        }
        const clr = parseInt(clrStr, 10);
        const uid = parseInt(uidStr, 10);
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

  let printIIDs = false;
  let printUsers = false;
  const columns = ['#'];
  const types = ['number'];
  if (!filterIP && ip2Id.size > 0) {
    printIIDs = true;
    columns.push('IID');
    types.push('uuid');
  }
  if (!filterIP && uid2Name.size > 0) {
    printUsers = true;
    columns.push('User');
    types.push('user');
  }
  columns.push('coord', 'clr', 'time');
  types.push('coord', 'clr', 'ts');

  const rows = [];
  for (let i = 0; i < pixelF.length; i += 1) {
    const [ip, uid, x, y, clr, ts] = pixelF[i];
    const row = [i];
    if (printIIDs) {
      row.push(ip2Id.get(ip) || 'N/A');
    }
    if (printUsers) {
      const userMd = (uid && uid2Name.has(uid))
        ? `${uid2Name.get(uid)},${uid}` : 'N/A';
      row.push(userMd);
    }
    row.push(`${x},${y}`, clr, ts);
    rows.push(row);
  }

  return {
    columns,
    types,
    rows,
  };
}
