/*
 * get information from ip
 */

import net from 'net';

import { isIPv6, ip4InRangeToCIDR } from './ip';
import { OUTGOING_ADDRESS } from '../core/config';

const WHOIS_PORT = 43;
const QUERY_SUFFIX = '\r\n';
const WHOIS_TIMEOUT = 30000;

function splitStringBy(string, by) {
  return [string.slice(0, by), string.slice(by + 1)];
}

function parseSimpleWhois(whois) {
  const data = {};
  const text = [];

  const renameLabels = {
    NetRange: 'range',
    inetnum: 'range',
    CIDR: 'route',
    origin: 'asn',
    OriginAS: 'asn',
  };
  const lineToGroup = {
    contact: 'contact',
    OrgName: 'organisation',
    organisation: 'organisation',
    OrgAbuseHandle: 'contactAbuse',
    irt: 'contactAbuse',
    RAbuseHandle: 'contactAbuse',
    OrgTechHandle: 'contactTechnical',
    RTechHandle: 'contactTechnical',
    OrgNOCHandle: 'contactNoc',
    RNOCHandle: 'contactNoc',
  };

  if (whois.includes('returned 0 objects') || whois.includes('No match found')) {
    return data;
  }

  let resultNum = 0;
  const groups = [{}];
  let lastLabel;

  whois.split('\n').forEach((line) => {
    // catch comment lines
    if (line.startsWith('%') || line.startsWith('#')) {
      // detect if an ASN or IP has multiple WHOIS results
      if (line.includes('# start')) {
        // nothing
      } else if (line.includes('# end')) {
        resultNum++;
      } else {
        text.push(line);
      }
    } else if (resultNum === 0) {
      // for the moment, parse only first WHOIS result

      if (line) {
        if (line.includes(':')) {
          const [label, value] = splitStringBy(line, line.indexOf(':')).map((info) => info.trim());
          lastLabel = label;

          // 1) Filter out unnecessary info, 2) then detect if the label is already added to group
          if (value.includes('---')) {
            // do nothing with useless data
          } else if (groups[groups.length - 1][label]) {
            groups[groups.length - 1][label] += `\n${value}`;
          } else {
            groups[groups.length - 1][label] = value;
          }
        } else {
          groups[groups.length - 1][lastLabel] += `\n${line.trim()}`;
        }
      } else if (Object.keys(groups[groups.length - 1]).length) {
        // if empty line, means another info group starts
        groups.push({});
      }
    }
  });

  groups
    .filter((group) => Object.keys(group).length)
    .forEach((group) => {
      const groupLabels = Object.keys(group);
      let isGroup = false;

      // check if a label is marked as group
      groupLabels.forEach((groupLabel) => {
        if (!isGroup && Object.keys(lineToGroup).includes(groupLabel)) {
          isGroup = lineToGroup[groupLabel];
        }
      });

      // check if a info group is a Contact in APNIC result
      // @Link https://www.apnic.net/manage-ip/using-whois/guide/role/
      if (!isGroup && groupLabels.includes('role')) {
        isGroup = `Contact ${group.role.split(' ')[1]}`;
      } else if (!isGroup && groupLabels.includes('person')) {
        isGroup = `Contact ${group['nic-hdl']}`;
      }

      if (isGroup === 'contact') {
        data.contacts = data.contacts || {};
        data.contacts[group.contact] = group;
      } else if (isGroup) {
        data[isGroup] = group;
      } else {
        groupLabels.forEach((key) => {
          const label = renameLabels[key] || key;
          data[label] = group[key];
        });
      }
    });

  // Append the WHOIS comments
  data.text = text;

  return data;
}

function whoisQuery(
  host = null,
  query = '',
) {
  console.log('whois with query', query, 'for host', host);
  return new Promise((resolve, reject) => {
    let data = '';
    const socket = net.createConnection({
      host,
      port: WHOIS_PORT,
      localAddress: OUTGOING_ADDRESS,
      timeout: WHOIS_TIMEOUT,
    }, () => socket.write(query + QUERY_SUFFIX));
    socket.on('data', (chunk) => { data += chunk; });
    socket.on('close', () => resolve(data));
    socket.on('timeout', () => socket.destroy(new Error('Timeout')));
    socket.on('error', reject);
  });
}

async function whoisIp(query) {
  query = String(query);

  // find WHOIS server for IP
  let whoisResult = await whoisQuery('whois.iana.org', query);
  whoisResult = parseSimpleWhois(whoisResult);
  const host = whoisResult.whois;

  if (!host) {
    throw new Error(`No WHOIS server for "${query}"`);
  }

  // hardcoded custom queries..
  console.log('HOST', host);
  if (host === 'whois.arin.net') {
    query = `+ n ${query}`;
  } else if (host === 'whois.ripe.net') {
    /*
     * flag to not return personal informations, otherwise
     * RIPE is gonne rate limit and ban
     */
    query = `-r ${query}`;
  }

  const rawResult = await whoisQuery(host, query);
  console.log(rawResult);
  const data = parseSimpleWhois(rawResult);

  return data;
}

/*
 * get CIDR of ip from whois return
 * @param ip ip string
 * @param whois whois return
 * @return cidr string
 */
function cIDRofWhois(ip, whoisData) {
  if (isIPv6(ip)) {
    return whoisData.inet6num
      || (whoisData.range && !whoisData.range.includes('-') && whoisData.range)
      || whoisData.route
      || null;
  }
  const { range } = whoisData;
  if (range && range.includes('/') && !range.includes('-')) {
    return range;
  }
  return ip4InRangeToCIDR(ip, range) || null;
}

/*
 * get organisation from whois return
 * @param whois whois return
 * @return organisation string
 */
function orgFromWhois(whoisData) {
  return (whoisData.organisation && whoisData.organisation['org-name'])
    || (whoisData.organisation && whoisData.organisation.OrgName)
    || (whoisData['Contact Master']
      && whoisData['Contact Master'].address.split('\n')[0])
    || (whoisData['Contact undefined']
      && whoisData['Contact undefined'].person)
    || whoisData.netname
    || whoisData.owner
    || 'N/A';
}

/*
 * get counry from whois return
 * @param whois whois return
 * @return organisation string
 */
function countryFromWhois(whoisData) {
  return whoisData.country
    || (whoisData.organisation && whoisData.organisation.Country)
    || 'xx';
}

/*
 * parse whois return
 * @param ip ip string
 * @param whois whois return
 * @return object with whois data
 */
function parseWhois(ip, whoisData) {
  return {
    ip,
    country: countryFromWhois(whoisData),
    cidr: cIDRofWhois(ip, whoisData) || 'N/A',
    org: orgFromWhois(whoisData),
    descr: whoisData.descr || 'N/A',
    asn: whoisData.asn || whoisData['aut-num'] || 'N/A',
  };
}

export default async function whoiser(ip) {
  const whoisData = await whoisIp(ip);
  if (whoisData.ReferralServer) {
    let referral = whoisData.ReferralServer;
    const prot = referral.indexOf('://');
    if (prot !== -1) {
      referral = referral.slice(prot + 3);
    }
    try {
      /*
       * if referral whois server produces any error
       * fallback to initial one
       */
      const refWhoisData = await whoisIp(ip, {
        host: referral,
      });
      const refParsedData = parseWhois(ip, refWhoisData);
      if (refParsedData.cidr !== 'N/A') {
        return refParsedData;
      }
    } catch {
      // nothing
    }
  }
  console.log(whoisData);
  return parseWhois(ip, whoisData);
}
