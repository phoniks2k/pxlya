/*
 * redis script for user pixel placement
 * this does not set any pixels itself, see lua/placePixel.lua
 */
import client from './client';
import { getIPv6Subnet } from '../../utils/ip';
import { PREFIX as CAPTCHA_PREFIX } from './captcha';
import { PREFIX as ALLOWED_PREFIX } from './isAllowedCache';
import { CAPTCHA_TIME } from '../../core/config';

/*
 * gets pixels and chunk coords and checks if
 * and how many a user can set and sets the cooldown accordingly
 * @param ip ip of request
 * @param id userId
 * @param clrIgnore, bcd, pcd, cds incormations about canvas
 * @param i, j chunk coordinates
 * @param pxls Array with offsets of pixels
 * @return see lua/placePixel.lua
 */
export default function allowPlace(
  ip,
  id,
  canvasId,
  i, j,
  clrIgnore,
  bcd,
  pcd,
  cds,
  pxls,
) {
  const ipn = getIPv6Subnet(ip);
  const isalKey = `${ALLOWED_PREFIX}:${ipn}`;
  const captKey = (CAPTCHA_TIME >= 0) ? `${CAPTCHA_PREFIX}:${ipn}` : 'nope';
  const ipCdKey = `cd:${canvasId}:ip:${ipn}`;
  const idCdKey = (id) ? `cd:${canvasId}:id:${id}` : 'nope';
  const chunkKey = `ch:${canvasId}:${i}:${j}`;
  return client.placePxl(
    isalKey, captKey, ipCdKey, idCdKey, chunkKey,
    clrIgnore, bcd, pcd, cds,
    ...pxls,
  );
}
