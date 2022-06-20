/**
 * send initial data to player
 */


import getMe from '../../core/me';
import {
  USE_PROXYCHECK,
} from '../../core/config';
import { cheapDetector } from '../../core/isProxy';


export default async (req, res, next) => {
  try {
    const { user, lang } = req;
    const userdata = await getMe(user, lang);
    user.updateLogInTimestamp();

    const { trueIp: ip } = req;
    if (USE_PROXYCHECK && ip !== '0.0.0.1') {
      // pre-fire cheap Detector to give it time to get a real result
      // once api_pixel needs it
      cheapDetector(ip);
    }

    // https://stackoverflow.com/questions/49547/how-to-control-web-page-caching-across-all-browsers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Expires: '0',
    });
    res.json(userdata);
  } catch (error) {
    next(error);
  }
};
