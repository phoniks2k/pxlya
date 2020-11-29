/**
 * basic admin api
 * is used by ../components/Admintools
 *
 * @flow
 *
 */

import express from 'express';
import expressLimiter from 'express-limiter';
import type { Request, Response } from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';

import { getIPFromRequest } from '../utils/ip';
import redis from '../data/redis';
import session from '../core/session';
import passport from '../core/passport';
import { admintoolsLogger } from '../core/logger';
import { MINUTE } from '../core/constants';
import {
  executeIPAction,
  executeImageAction,
  executeProtAction,
  executeRollback,
  getModList,
  removeMod,
  makeMod,
} from '../core/adminfunctions';


const router = express.Router();
const limiter = expressLimiter(router, redis);


/*
 * multer middleware for getting POST parameters
 * into req.file (if file) and req.body for text
 */
router.use(bodyParser.urlencoded({ extended: true }));
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});


/*
 * rate limiting to prevent bruteforce attacks
 * TODO: do that with nginx
 */
router.use('/',
  limiter({
    lookup: 'headers.cf-connecting-ip',
    total: 240,
    expire: 5 * MINUTE,
    skipHeaders: true,
  }));


/*
 * make sure User is logged in and mod or admin
 */
router.use(session);
router.use(passport.initialize());
router.use(passport.session());
router.use(async (req, res, next) => {
  const ip = getIPFromRequest(req);
  if (!req.user) {
    admintoolsLogger.info(`ADMINTOOLS: ${ip} tried to access admintools without login`);
    res.status(403).send('You are not logged in');
    return;
  }
  /*
   * 1 = Admin
   * 2 = Mod
   */
  if (!req.user.userlvl) {
    admintoolsLogger.info(
      `ADMINTOOLS: ${ip} / ${req.user.id} tried to access admintools`,
    );
    res.status(403).send('You are not allowed to access this page');
    return;
  }
  admintoolsLogger.info(
    `ADMINTOOLS: ${req.user.id} / ${req.user.regUser.name} is using admintools`,
  );

  next();
});


/*
 * Post for mod + admin
 */
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (req.body.imageaction) {
      const { imageaction, coords, canvasid } = req.body;
      const [ret, msg] = await executeImageAction(
        imageaction,
        req.file,
        coords,
        canvasid,
      );
      res.status(ret).send(msg);
      return;
    } if (req.body.protaction) {
      const {
        protaction, ulcoor, brcoor, canvasid,
      } = req.body;
      const [ret, msg] = await executeProtAction(
        protaction,
        ulcoor,
        brcoor,
        canvasid,
      );
      res.status(ret).send(msg);
      return;
    } if (req.body.rollback) {
      // rollback is date as YYYYMMdd
      const {
        rollback, ulcoor, brcoor, canvasid,
      } = req.body;
      const [ret, msg] = await executeRollback(
        rollback,
        ulcoor,
        brcoor,
        canvasid,
      );
      res.status(ret).send(msg);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
});


/*
 * just admins past here, no Mods
 */
router.use(async (req, res, next) => {
  if (req.user.userlvl !== 1) {
    res.status(403).send('Just admins can do that');
    return;
  }
  next();
});

/*
 * Post just for admin
 */
router.post('/', async (req, res, next) => {
  try {
    if (req.body.ipaction) {
      const ret = await executeIPAction(req.body.ipaction, req.body.ip);
      res.status(200).send(ret);
      return;
    }
    if (req.body.modlist) {
      const ret = await getModList();
      res.status(200);
      res.json(ret);
      return;
    }
    if (req.body.remmod) {
      try {
        const ret = await removeMod(req.body.remmod);
        res.status(200).send(ret);
      } catch (e) {
        res.status(400).send(e.message);
      }
      return;
    }
    if (req.body.makemod) {
      try {
        const ret = await makeMod(req.body.makemod);
        res.status(200);
        res.json(ret);
      } catch (e) {
        res.status(400).send(e.message);
      }
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
});


router.use(async (req: Request, res: Response) => {
  res.status(400).send('Invalid request');
});


export default router;
