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
    return whoisData.inet6num || 'N/A';
  }
  return ip4InRangeToCIDR(ip, whoisData.range) || 'N/A';
}

/*
 * get organisation from whois return
 * @param whois whois return
 * @return organisation string
 */
function orgFromWhois(whoisData) {
  return (whoisData.organisation && whoisData.organisation['org-name'])
    || (whoisData['Contact Master']
      && whoisData['Contact Master'].address.split('\n')[0])
    || whoisData.netname
    || 'N/A';
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
    country: whoisData.country || 'xx',
    cidr: cIDRofWhois(ip, whoisData),
    org: orgFromWhois(whoisData),
    descr: whoisData.descr || 'N/A',
    asn: whoisData.asn || 'N/A',
  };
}

async function whois(ip) {
  const whoisData = await whoiser.ip(ip);
  return parseWhois(ip, whoisData);
}

export default whois;
