-- Get multiple ranks from sorted set
--  Keys:
--    set: sorted set
--  Args:
--    [member,...] dynamic amount of members to look for
--  return:
--    table with the ranks, 0 for an item with no rank
local ret = {}
for c = 1,#ARGV do
  local rank = redis.call('zrevrank', KEYS[1], ARGV[c])
  if not rank then
    rank = 0
  end
  ret[c] = rank
end
return ret
