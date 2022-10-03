/*
 * This is just for verifying captcha tokens,
 * the actual notification that a captcha is needed is sent
 * with the pixel return answer when sending apixel on websocket
 *
 */

import logger from '../../core/logger';
import { checkCaptchaSolution } from '../../data/redis/captcha';
import { getIPFromRequest } from '../../utils/ip';

export default async (req, res) => {
  const ip = getIPFromRequest(req);
  const { t } = req.ttag;

  try {
    const { text, id } = req.body;

    const ret = await checkCaptchaSolution(
      text,
      ip,
      false,
      id,
    );

    switch (ret) {
      case 0:
        res.status(200)
          .json({ success: true });
        break;
      case 1:
        res.status(422)
          .json({
            errors: [t`You took too long, try again.`],
          });
        break;
      case 2:
        res.status(422)
          .json({ errors: [t`You failed your captcha`] });
        break;
      case 3:
        res.status(400)
          .json({ errors: [t`No captcha text given`] });
        break;
      case 4:
        res.status(400)
          .json({ errors: [t`No captcha id given`] });
        break;
      default:
        res.status(422)
          .json({ errors: [t`Unknown Captcha Error`] });
    }
  } catch (error) {
    logger.error('CAPTCHA', error);
    res.status(500)
      .json({
        errors: [t`Server error occured`],
      });
  }
};
