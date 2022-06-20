import express from 'express';

import session from '../../core/session';
import passport from '../../core/passport';
import logger from '../../core/logger';
import User from '../../data/User';
import { getIPFromRequest } from '../../utils/ip';

import me from './me';
import captcha from './captcha';
import auth from './auth';
import chatHistory from './chathistory';
import startDm from './startdm';
import leaveChan from './leavechan';
import block from './block';
import blockdm from './blockdm';
import modtools from './modtools';


const router = express.Router();

router.use(express.json());

router.use((err, req, res, next) => {
  if (err) {
    logger.warn(`Got invalid json from ${req.trueIp} on ${req.originalUrl}`);
    res.status(400);
    res.status(400).json({ errors: [{ msg: 'Invalid Request' }] });
  } else {
    next();
  }
});

// captcah doesn't need a user
router.post('/captcha', captcha);

/*
 * get user session
 */
router.use(session);

/*
 * at this point we could use the session id to get
 * stuff without having to verify the whole user,
 * which would avoid SQL requests and it got used previously
 * when we set pixels via api/pixel (new removed)
*/

/*
 * passport authenticate
 * and deserlialize
 * (makes that sql request to map req.user.regUser)
 * After this point it is assumes that user.regUser is set if user.id is too
 */
router.use(passport.initialize());
router.use(passport.session());

/*
 * modtools
 * (does not json bodies, but urlencoded)
 */
router.use('/modtools', modtools);

/*
 * create dummy user with just ip if not
 * logged in
 */
router.use(async (req, res, next) => {
  if (!req.user) {
    req.user = new User();
    await req.user.initialize(null, getIPFromRequest(req));
  }
  next();
});

router.post('/startdm', startDm);

router.post('/leavechan', leaveChan);

router.post('/block', block);

router.post('/blockdm', blockdm);

router.get('/chathistory', chatHistory);

router.get('/me', me);

router.use('/auth', auth);

export default router;
