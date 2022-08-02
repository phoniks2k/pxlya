/**
 * basic mod api
 * is used by ../components/Modtools
 *
 */

import express from 'express';
import multer from 'multer';

import CanvasCleaner from '../../core/CanvasCleaner';
import chatProvider from '../../core/ChatProvider';
import { getIPFromRequest } from '../../utils/ip';
import { escapeMd } from '../../core/utils';
import logger, { modtoolsLogger } from '../../core/logger';
import {
  executeIPAction,
  executeImageAction,
  executeProtAction,
  executeRollback,
  executeCleanerAction,
  executeWatchAction,
  getModList,
  removeMod,
  makeMod,
} from '../../core/adminfunctions';


const router = express.Router();

/*
 * multer middleware for getting POST parameters
 * into req.file (if file) and req.body for text
 */
router.use(express.urlencoded({ extended: true }));
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});


/*
 * make sure User is logged in and mod or mod
 */
router.use(async (req, res, next) => {
  const ip = getIPFromRequest(req);
  if (!req.user) {
    logger.warn(
      `MODTOOLS: ${ip} tried to access modtools without login`,
    );
    const { t } = req.ttag;
    res.status(403).send(t`You are not logged in`);
    return;
  }
  /*
   * 1 = Admin
   * 2 = Mod
   */
  if (!req.user.userlvl) {
    logger.warn(
      `MODTOOLS: ${ip} / ${req.user.id} tried to access modtools`,
    );
    const { t } = req.ttag;
    res.status(403).send(t`You are not allowed to access this page`);
    return;
  }

  next();
});


/*
 * Post for mod + admin
 */
router.post('/', upload.single('image'), async (req, res, next) => {
  const aLogger = (text) => {
    const timeString = new Date().toLocaleTimeString();
    // eslint-disable-next-line max-len
    const logText = `@[${escapeMd(req.user.regUser.name)}](${req.user.id}) ${text}`;
    modtoolsLogger.info(
      `${timeString} | MODTOOLS> ${logText}`,
    );
    chatProvider.broadcastChatMessage(
      'info',
      logText,
      chatProvider.enChannelId,
      chatProvider.infoUserId,
    );
  };

  try {
    if (req.body.cleanerstat) {
      const ret = CanvasCleaner.reportStatus();
      res.status(200);
      res.json(ret);
      return;
    }
    if (req.body.cleanercancel) {
      const ret = CanvasCleaner.stop();
      res.status(200).send(ret);
      return;
    }
    if (req.body.watchaction) {
      const {
        watchaction, ulcoor, brcoor, time, iid, canvasid,
      } = req.body;
      const ret = await executeWatchAction(
        watchaction,
        ulcoor,
        brcoor,
        time,
        iid,
        canvasid,
      );
      res.status(200).json(ret);
      return;
    }
    if (req.body.cleaneraction) {
      const {
        cleaneraction, ulcoor, brcoor, canvasid,
      } = req.body;
      const [ret, msg] = await executeCleanerAction(
        cleaneraction,
        ulcoor,
        brcoor,
        canvasid,
        aLogger,
      );
      res.status(ret).send(msg);
      return;
    }
    if (req.body.imageaction) {
      const { imageaction, coords, canvasid } = req.body;
      const [ret, msg] = await executeImageAction(
        imageaction,
        req.file,
        coords,
        canvasid,
        aLogger,
      );
      res.status(ret).send(msg);
      return;
    }
    if (req.body.protaction) {
      const {
        protaction, ulcoor, brcoor, canvasid,
      } = req.body;
      const [ret, msg] = await executeProtAction(
        protaction,
        ulcoor,
        brcoor,
        canvasid,
        aLogger,
      );
      res.status(ret).send(msg);
      return;
    }
    if (req.body.rollback) {
      // rollback is date as YYYYMMdd
      const {
        rollback, ulcoor, brcoor, canvasid,
      } = req.body;
      const [ret, msg] = await executeRollback(
        rollback,
        ulcoor,
        brcoor,
        canvasid,
        aLogger,
        (req.user.userlvl === 1),
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
    const { t } = req.ttag;
    res.status(403).send(t`Just admins can do that`);
    return;
  }
  next();
});

/*
 * Post just for admin
 */
router.post('/', async (req, res, next) => {
  const aLogger = (text) => {
    logger.info(`ADMIN> ${req.user.regUser.name}[${req.user.id}]> ${text}`);
  };

  try {
    if (req.body.ipaction) {
      const ret = await executeIPAction(
        req.body.ipaction,
        req.body.ip,
        aLogger,
      );
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


router.use(async (req, res) => {
  res.status(400).send('Invalid request');
});


export default router;
