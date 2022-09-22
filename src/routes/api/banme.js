/*
 * report that user shouldbe banned
 */

import logger from '../../core/logger';
import { banIP } from '../../data/sql/Ban';
import { getIPv6Subnet, getIPFromRequest } from '../../utils/ip';

async function banme(req, res) {
  const { code } = req.query;
  let reason = 'AUTOBAN';
  if (code === '1') {
    reason = 'Userscript Bot';
  } else if (code === '2') {
    const ua = req.headers['user-agent'];
    if (ua && ua.includes('OPR/')
      && (ua.includes('Android') || ua.includes('iPhone'))
    ) {
      res.json({
        status: 'nope',
      });
      return;
    }
    reason = 'Captcha Solving Script';
  }
  const ip = getIPFromRequest(req);
  logger.info(`AUTOBAN ${ip} of user ${req.user.id}`);
  await banIP(
    getIPv6Subnet(ip),
    reason,
    0,
    1,
  );
  res.json({
    status: 'ok',
  });
}

export default banme;
