-- Checking requirements and calculating cooldown of user wthin
-- redis itself. Does not set pixels directly. Pixels are set in batches
-- in RedisCanvas.js
-- This script will get copied into the dist/workers directory from webpack
-- Keys: 
--   isAlloweed: 'isal:ip' (proxycheck, blacklist, whitelist)
--   isHuman 'human:ip' (captcha needed when expired)
--   ipCD: 'cd:canvasId:ip:ip'
--   uCD: 'cd:canvasId:id:userId'
--   chunk: 'ch:canvasId:i:j'
-- Args:
--   clrIgnore: integer number of what colors are considered unset
--   bcd: number baseColldown (fixed to cdFactor and 0 if admin)
--   pcd: number set pixel cooldown  (fixed to cdFactor and 0 if admin)
--   cds: max cooldown of canvas
--   off1, chonk offset of first pixel
--   off2, chonk offset of second pixel
--   ..., infinie pixels possible
-- Returns:
--   {
--     1: pixel return status code (check ui/placePixel.js)
--     2: amount of successfully set pixels
--     3: total cooldown of user
--     4: info about placed pixel cooldown (addition of last pixel)
--     5: if we have to update isAllowed( proxycheck)
--   }
local ret = {0, 0, 0, 0, 0}
-- check if captcha is needed
if KEYS[2] ~= "nope" and not redis.call('get', KEYS[2]) then
  -- captcha
  ret[1] = 10
  return ret
end
-- check if isAllowed
local ia = redis.call('get', KEYS[1])
if not ia then
  ret[5] = 1
else
  ia = tonumber(ia)
  if ia > 0 then
    if ia == 1 then
      -- proxy
      ret[1] = 11
    elseif ia == 2 then
      -- banned
      ret[1] = 14
    elseif ia == 3 then
      -- range banned
      ret[1] = 15
    end
    return ret
  end
end
-- get cooldown of user
local cd = redis.call('pttl', KEYS[3])
if cd < 0 then
  cd = 0
end
if KEYS[4] ~= "nope" then
  local icd = redis.call('pttl', KEYS[4])
  if icd > cd then
    cd = icd
  end
end
-- set pixels
local pxlcd = 0
local pxlcnt = 0
local cli = tonumber(ARGV[1])
local bcd = tonumber(ARGV[2])
local pcd = tonumber(ARGV[3])
local cds = tonumber(ARGV[4])
for c = 5,#ARGV do
  local off = tonumber(ARGV[c]) * 8
  local clr = tonumber(ARGV[c + 1])
  -- get color of pixel on canvas
  local sclr = redis.call('bitfield', KEYS[5], 'get', 'u8', off)
  sclr = sclr[1]
  -- check if protected (protected is last bit in u8)
  if sclr >= 128 then
    -- pixel protected
    ret[1] = 8
    break
  end
  -- calculate cooldown of pixel
  pxlcd = bcd
  if sclr >= cli then
    pxlcd = pcd
  end
  cd = cd + pxlcd
  if cd > cds then
    cd = cd - pxlcd
    pxlcd = cds - cd - pxlcd
    -- pixelstack used up
    ret[1] = 9
    break
  end
  pxlcnt = pxlcnt + 1
end

if pxlcnt > 0 and cd > 0 then
  redis.call('set', KEYS[3], '', 'px', cd)
  if KEYS[4] ~= "nope" then
    redis.call('set', KEYS[4], '', 'px', cd)
  end
end

ret[2] = pxlcnt
ret[3] = cd
ret[4] = pxlcd
return ret
