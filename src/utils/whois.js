/*
 * get information from ip
 */

import whoiser from 'whoiser';

import { isIPv6, ip4InRangeToCIDR } from './ip';


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
      || 'N/A';
  }
  const { range } = whoisData;
  if (range.includes('/') && !range.includes('-')) {
    return range;
  }
  return ip4InRangeToCIDR(ip, range) || 'N/A';
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
    cidr: cIDRofWhois(ip, whoisData),
    org: orgFromWhois(whoisData),
    descr: whoisData.descr || 'N/A',
    asn: whoisData.asn || 'N/A',
  };
}

async function whois(ip) {
  let whoisData = await whoiser.ip(ip);
  if (whoisData.ReferralServer) {
    let referral = whoisData.ReferralServer;
    const prot = referral.indexOf('://');
    if (prot !== -1) {
      referral = referral.slice(prot + 3);
    }
    try {
      whoisData = await whoiser.ip(ip, {
        host: referral,
      });
    } catch {
      // nothing
    }
  }
  return parseWhois(ip, whoisData);
}

export default whois;
