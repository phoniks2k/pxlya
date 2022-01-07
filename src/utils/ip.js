/**
 *
 * basic functions to get data fromheaders and parse IPs
 */

import logger from '../core/logger';

import { USE_XREALIP } from '../core/config';


export function getHostFromRequest(req, includeProto = true) {
  const { headers } = req;
  const host = headers['x-forwarded-host']
    || headers.host
    || headers[':authority'];
  if (!includeProto) {
    return host;
  }

  const proto = headers['x-forwarded-proto'] || 'http';
  return `${proto}://${host}`;
}

export function getIPFromRequest(req) {
  if (USE_XREALIP) {
    const ip = req.headers['x-real-ip'];
    if (ip) {
      return ip;
    }
  }

  const { socket, connection } = req;

  let conip = (connection ? connection.remoteAddress : socket.remoteAddress);
  conip = conip || '0.0.0.1';

  if (!USE_XREALIP) {
    logger.warn(
      `Connection not going through reverse proxy! IP: ${conip}`, req.headers,
    );
  }

  return conip;
}

export function getIPv6Subnet(ip) {
  if (ip.includes(':')) {
    // eslint-disable-next-line max-len
    const ipv6sub = `${ip.split(':').slice(0, 4).join(':')}:0000:0000:0000:0000`;
    // logger.warn("IPv6 subnet: ", ipv6sub);
    return ipv6sub;
  }
  return ip;
}
