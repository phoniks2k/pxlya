/*
 * Collect api fetch commands for actions here
 * (chunk and tiles requests in ui/ChunkLoader*.js)
 * (user settings requests in their components)
 *
 * @flow
 */


/*
 * Adds customizeable timeout to fetch
 * defaults to 8s
 */
async function fetchWithTimeout(resource, options) {
  const { timeout = 8000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);

  return response;
}

/*
 * block / unblock user
 * userId id of user to block
 * block true if block, false if unblock
 * return error string or null if successful
 */
export async function requestBlock(userId: number, block: boolean) {
  const response = await fetchWithTimeout('api/block', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      block,
    }),
  });

  try {
    const res = await response.json();
    if (res.errors) {
      return res.errors[0];
    }
    if (response.ok && res.status === 'ok') {
      return null;
    }
    return 'Unknown Error';
  } catch {
    return 'Connection Error';
  }
}

/*
 * start new DM channel with user
 * query Object with either userId: number or userName: string
 * return channel Array on success, error string if not
 */
export async function requestStartDm(query) {
  const response = await fetchWithTimeout('api/startdm', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
  });

  try {
    const res = await response.json();
    if (res.errors) {
      return res.errors[0];
    }
    if (response.ok && res.channel) {
      const { channel } = res;
      return channel;
    }

    return 'Unknown Error';
  } catch {
    return 'Connection Error';
  }
}

/*
 * set receiving of all DMs on/off
 * block true if blocking all dms, false if unblocking
 * return error string or null if successful
 */
export async function requestBlockDm(block: boolean) {
  const response = await fetchWithTimeout('api/blockdm', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ block }),
  });

  try {
    const res = await response.json();
    if (res.errors) {
      return res.errors[0];
    }
    if (response.ok && res.status === 'ok') {
      return null;
    }
    return 'Unknown Error';
  } catch {
    return 'Connection Error';
  }
}

/*
 * leaving Chat Channel (i.e. DM channel)
 * channelId 8nteger id of channel
 * return error string or null if successful
 */
export async function requestLeaveChan(channelId: boolean) {
  const response = await fetchWithTimeout('api/leavechan', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channelId }),
  });

  try {
    const res = await response.json();
    if (res.errors) {
      return res.errors[0];
    }
    if (response.ok && res.status === 'ok') {
      return null;
    }
    return 'Unknown Error';
  } catch {
    return 'Connection Error';
  }
}
