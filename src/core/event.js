/*
 * This is an even that happens all 2h,
 * if the users complete, they will get rewarded by half the cooldown sitewide
 *
 * @flow
 */

import logger from './logger';
import {
  nextEvent,
  setNextEvent,
  setSuccess,
  getSuccess,
  getEventArea,
  clearOldEvent,
  CANVAS_ID,
} from '../data/models/Event';
import Void from './Void';
import { protectCanvasArea } from './Image';
import { setPixelByOffset } from './setPixel';
import { TILE_SIZE, EVENT_USER_NAME } from './constants';
import chatProvider from './ChatProvider';
import { HOURLY_EVENT } from './config';
// eslint-disable-next-line import/no-unresolved
import canvases from './canvases.json';

// steps in minutes for event stages
const STEPS = [30, 10, 2, 1, 0, -10, -15, -40, -60];
// const STEPS = [4, 3, 2, 1, 0, -1, -2, -3, -4];
// gap between events in min, starting 1h after last event
// so 60 is a 2h gap, has to be higher than first and highest STEP numbers
const EVENT_GAP_MIN = 60;
// const EVENT_GAP_MIN = 5;

/*
 * draw cross in center of chunk
 * @param centerCell chunk coordinates
 * @param clr color
 * @param style 0 solid, 1 dashed, 2 dashed invert
 * @param radius Radius (total width/height will be radius * 2 + 1)
 */
function drawCross(centerCell, clr, style, radius) {
  const [i, j] = centerCell;
  const center = (TILE_SIZE + 1) * TILE_SIZE / 2;
  if (style !== 2) {
    setPixelByOffset(CANVAS_ID, clr, i, j, center);
  }
  for (let r = 1; r < radius; r += 1) {
    if (style) {
      if (r % 2) {
        if (style === 1) continue;
      } else if (style === 2) {
        continue;
      }
    }
    let offset = center - TILE_SIZE * r;
    setPixelByOffset(CANVAS_ID, clr, i, j, offset);
    offset = center + TILE_SIZE * r;
    setPixelByOffset(CANVAS_ID, clr, i, j, offset);
    offset = center - r;
    setPixelByOffset(CANVAS_ID, clr, i, j, offset);
    offset = center + r;
    setPixelByOffset(CANVAS_ID, clr, i, j, offset);
  }
}


class Event {
  eventState: number;
  eventTimestamp: number;
  eventCenter: Array;
  eventCenterC: Array;
  eventArea: Array;
  // 0 if waiting
  // 1 if won
  // 2 if lost
  success: boolean;
  void: Object;
  chatTimeout: number;

  constructor() {
    this.enabled = HOURLY_EVENT;
    this.eventState = -1;
    this.eventCenterC = null;
    this.void = null;
    this.chatTimeout = 0;
    this.runEventLoop = this.runEventLoop.bind(this);
    if (HOURLY_EVENT) {
      this.initEventLoop();
    }
  }

  async initEventLoop() {
    this.success = await getSuccess();
    let eventTimestamp = await nextEvent();
    if (!eventTimestamp) {
      eventTimestamp = await Event.setNextEvent();
      await this.calcEventCenter();
      const [x, y, w, h] = this.eventArea;
      await protectCanvasArea(CANVAS_ID, x, y, w, h, true);
    }
    this.eventTimestamp = eventTimestamp;
    await this.calcEventCenter();
    this.runEventLoop();
  }

  eventTimer() {
    const now = Date.now();
    return Math.floor((this.eventTimestamp - now) / 1000);
  }

  async calcEventCenter() {
    const cCoor = await getEventArea();
    if (cCoor) {
      this.eventCenterC = cCoor;
      const {
        size: canvasSize,
      } = canvases[CANVAS_ID];
      const [ux, uy] = cCoor.map((z) => (z - 1) * TILE_SIZE - canvasSize / 2);
      this.eventArea = [ux, uy, TILE_SIZE * 3, TILE_SIZE * 3];
    }
  }

  static getDirection(x, y) {
    const { size: canvasSize } = canvases[CANVAS_ID];
    let direction = null;
    const distSquared = x ** 2 + y ** 2;

    if (distSquared < 1000 ** 2) direction = 'center';
    else if (x < 0 && y < 0) direction = 'North-West';
    else if (x >= 0 && y < 0) direction = 'North-East';
    else if (x < 0 && y >= 0) direction = 'South-West';
    else if (x >= 0 && y >= 0) direction = 'South-East';
    if (distSquared > (canvasSize / 2) ** 2) direction = `far ${direction}`;

    return direction;
  }

  static async setNextEvent() {
    // define next Event area
    const { size: canvasSize } = canvases[CANVAS_ID];
    // make sure that its the center of a 3x3 area
    const i = Math.floor(Math.random() * (canvasSize / TILE_SIZE - 2)) + 1;
    const j = Math.floor(Math.random() * (canvasSize / TILE_SIZE - 2)) + 1;
    // backup it and schedul next event in 1h
    await setNextEvent(EVENT_GAP_MIN, i, j);
    const timestamp = await nextEvent();
    const x = i * TILE_SIZE - canvasSize / 2;
    const y = j * TILE_SIZE - canvasSize / 2;
    Event.broadcastChatMessage(
      `Suspicious activity spotted in ${Event.getDirection(x, y)}`,
    );
    drawCross([i, j], 19, 0, 13);
    logger.info(`Set next Event in 60min at ${x},${y}`);
    return timestamp;
  }

  static broadcastChatMessage(message) {
    if (chatProvider.enChannelId && chatProvider.eventUserId) {
      chatProvider.broadcastChatMessage(
        EVENT_USER_NAME,
        message,
        chatProvider.enChannelId,
        chatProvider.eventUserId,
      );
    }
  }

  async runEventLoop() {
    const {
      eventState,
    } = this;
    const eventSeconds = this.eventTimer();
    const eventMinutes = eventSeconds / 60;

    if (eventMinutes > STEPS[0]) {
      // 1h to 30min before Event: blinking dotted cross
      if (eventState !== 1) {
        this.eventState = 1;
        // color 15 protected
        drawCross(this.eventCenterC, 15, 1, 9);
        drawCross(this.eventCenterC, 0, 2, 9);
      } else {
        this.eventState = 2;
        drawCross(this.eventCenterC, 16, 2, 9);
        drawCross(this.eventCenterC, 0, 1, 9);
      }
      setTimeout(this.runEventLoop, 2000);
    } else if (eventMinutes > STEPS[1]) {
      // 10min to 30min before Event: blinking solid cross
      if (eventState !== 3 && eventState !== 4) {
        this.eventState = 3;
        const [x, y] = this.eventArea;
        Event.broadcastChatMessage(
          `Unstable area at ${Event.getDirection(x, y)} at concerning level`,
        );
      }
      if (eventState !== 3) {
        this.eventState = 3;
        drawCross(this.eventCenterC, 30, 1, 9);
        drawCross(this.eventCenterC, 0, 2, 9);
      } else {
        this.eventState = 4;
        drawCross(this.eventCenterC, 31, 2, 9);
        drawCross(this.eventCenterC, 0, 1, 9);
      }
      setTimeout(this.runEventLoop, 1500);
    } else if (eventMinutes > STEPS[2]) {
      // 2min to 10min before Event: blinking solid cross
      if (eventState !== 5) {
        this.eventState = 5;
        drawCross(this.eventCenterC, 12, 0, 7);
      } else {
        this.eventState = 6;
        drawCross(this.eventCenterC, 13, 0, 7);
      }
      setTimeout(this.runEventLoop, 1000);
    } else if (eventMinutes > STEPS[3]) {
      // 1min to 2min before Event: blinking solid cross red small
      if (eventState !== 7 && eventState !== 8) {
        this.eventState = 7;
        const [x, y] = this.eventArea;
        const [xNear, yNear] = [x, y].map((z) => {
          const rand = Math.random() * 3000 - 500;
          return Math.floor(z + TILE_SIZE * 1.5 + rand);
        });
        Event.broadcastChatMessage(
          `Alert! Threat is rising in 2min near #d,${xNear},${yNear},30`,
        );
      }
      if (eventState !== 7) {
        drawCross(this.eventCenterC, 11, 0, 5);
        this.eventState = 7;
      } else {
        drawCross(this.eventCenterC, 12, 0, 5);
        this.eventState = 8;
      }
      setTimeout(this.runEventLoop, 1000);
    } else if (eventMinutes > STEPS[4]) {
      // 1min till Event: blinking solid cross red small fase
      if (eventState !== 9 && eventState !== 10) {
        this.eventState = 9;
        Event.broadcastChatMessage(
          'Alert! Danger!',
        );
      }
      if (eventState !== 9) {
        this.eventState = 9;
        drawCross(this.eventCenterC, 11, 0, 3);
      } else {
        this.eventState = 10;
        drawCross(this.eventCenterC, 19, 0, 3);
      }
      setTimeout(this.runEventLoop, 500);
    } else if (eventMinutes > STEPS[5]) {
      if (eventState !== 11) {
        // start event
        const [x, y, w, h] = this.eventArea;
        await protectCanvasArea(CANVAS_ID, x, y, w, h, false);
        logger.info(`Starting Event at ${x},${y} now`);
        Event.broadcastChatMessage(
          'Fight starting!',
        );
        this.void = new Void(this.eventCenterC);
        this.eventState = 11;
      } else if (this.void) {
        const percent = this.void.checkStatus();
        if (percent === 100) {
          // event lost
          logger.info(`Event got lost after ${Math.abs(eventMinutes)} min`);
          Event.broadcastChatMessage(
            'Threat couldn\'t be contained, abandon area',
          );
          this.success = 2;
          setSuccess(2);
          this.void = null;
          const [x, y, w, h] = this.eventArea;
          await protectCanvasArea(CANVAS_ID, x, y, w, h, true);
        } else {
          const now = Date.now();
          if (now > this.chatTimeout) {
            Event.broadcastChatMessage(
              `Clown Void reached ${percent}% of its max size`,
            );
            this.chatTimeout = now + 40000;
          }
        }
      }
      // run event for 10min
      setTimeout(this.runEventLoop, 1000);
    } else if (eventMinutes > STEPS[6]) {
      if (eventState !== 12) {
        // after 10min of event
        // check if won
        if (this.void) {
          if (this.void.checkStatus() !== 100) {
            // event won
            logger.info('Event got won! Cooldown sitewide now half.');
            Event.broadcastChatMessage(
              'Threat successfully defeated. Good work!',
            );
            this.success = 1;
            setSuccess(1);
          }
          this.void.cancel();
          this.void = null;
        }
        this.eventState = 12;
      }
      // for 30min after event
      // do nothing
      setTimeout(this.runEventLoop, 60000);
    } else if (eventMinutes > STEPS[7]) {
      if (eventState !== 13) {
        // 5min after last Event
        // end debuff if lost
        if (this.success === 2) {
          Event.broadcastChatMessage(
            'Void seems to leave again.',
          );
          this.success = 0;
          setSuccess(0);
        }
        this.eventState = 13;
      }
      setTimeout(this.runEventLoop, 60000);
    } else if (eventMinutes > STEPS[8]) {
      if (eventState !== 14) {
        // 30min after last Event
        // clear old event area
        // reset success state
        logger.info('Restoring old event area');
        await clearOldEvent();
        if (this.success === 1) {
          Event.broadcastChatMessage(
            'Celebration time over, get back to work.',
          );
          this.success = 0;
          setSuccess(0);
        }
        this.eventState = 14;
      }
      // 30min to 50min after last Event
      // do nothing
      setTimeout(this.runEventLoop, 60000);
    } else {
      // 50min after last Event / 1h before next Event
      // define and protect it
      this.eventTimestamp = await Event.setNextEvent();
      await this.calcEventCenter();
      const [x, y, w, h] = this.eventArea;
      await protectCanvasArea(CANVAS_ID, x, y, w, h, true);

      setTimeout(this.runEventLoop, 60000);
    }
  }
}

const rpgEvent = new Event();

export default rpgEvent;
