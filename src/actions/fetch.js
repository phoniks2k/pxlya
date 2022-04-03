/*
 * Collect api fetch commands for actions here
 * (chunk and tiles requests in ui/ChunkLoader*.js)
 *
 */

import { t } from 'ttag';

import { dateToString } from '../core/utils';

/*
 * Adds customizeable timeout to fetch
 * defaults to 8s
 */
async function fetchWithTimeout(resource, options = {}) {
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
 * Parse response from API
 * @param response
 * @return Object of response
 */
async function parseAPIresponse(response) {
  const { status: code } = response;

  if (code === 429) {
    let error = t`You made too many requests`;
    const retryAfter = response.headers.get('Retry-After');
    if (!Number.isNaN(Number(retryAfter))) {
      const ti = Math.floor(retryAfter / 60);
      error += `, ${t`try again after ${ti}min`}`;
    }
    return {
      errors: [error],
    };
  }

  try {
    return await response.json();
  } catch (e) {
    return {
      errors: [t`Connection error ${code} :(`],
    };
  }
}

/*
 * Make API POST Request
 * @param url URL of post api endpoint
 * @param body Body of request
 * @return Object with response or error Array
 */
async function makeAPIPOSTRequest(url, body) {
  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return parseAPIresponse(response);
  } catch (e) {
    return {
      errors: [t`Could not connect to server, please try again later :(`],
    };
  }
}

/*
 * Make API GET Request
 * @param url URL of get api endpoint
 * @return Object with response or error Array
 */
async function makeAPIGETRequest(url) {
  try {
    const response = await fetchWithTimeout(url, {
      credentials: 'include',
    });

    return parseAPIresponse(response);
  } catch (e) {
    return {
      errors: [t`Could not connect to server, please try again later :(`],
    };
  }
}

/*
 * block / unblock user
 * @param userId id of user to block
 * @param block true if block, false if unblock
 * @return error string or null if successful
 */
export async function requestBlock(userId, block) {
  const res = await makeAPIPOSTRequest(
    'api/block',
    { userId, block },
  );
  if (res.errors) {
    return res.errors[0];
  }
  if (res.status === 'ok') {
    return null;
  }
  return t`Unknown Error`;
}

/*
 * start new DM channel with user
 * @param query Object with either userId or userName: string
 * @return channel Array on success, error string if not
 */
export async function requestStartDm(query) {
  const res = await makeAPIPOSTRequest(
    'api/startdm',
    query,
  );
  if (res.errors) {
    return res.errors[0];
  }
  if (res.channel) {
    return res.channel;
  }
  return t`Unknown Error`;
}

/*
 * set receiving of all DMs on/off
 * @param block true if blocking all dms, false if unblocking
 * @return error string or null if successful
 */
export async function requestBlockDm(block) {
  const res = await makeAPIPOSTRequest(
    'api/blockdm',
    { block },
  );
  if (res.errors) {
    return res.errors[0];
  }
  if (res.status === 'ok') {
    return null;
  }
  return t`Unknown Error`;
}

/*
 * leaving Chat Channel (i.e. DM channel)
 * @param channelId 8nteger id of channel
 * @return error string or null if successful
 */
export async function requestLeaveChan(channelId) {
  const res = await makeAPIPOSTRequest(
    'api/leavechan',
    { channelId },
  );
  if (res.errors) {
    return res.errors[0];
  }
  if (res.status === 'ok') {
    return null;
  }
  return t`Unknown Error`;
}

export async function requestSolveCaptcha(text, captchaid) {
  const res = await makeAPIPOSTRequest(
    'api/captcha',
    { text, id: captchaid },
  );
  if (!res.errors && !res.success) {
    return {
      errors: [t`Server answered with gibberish :(`],
    };
  }
  return res;
}

export async function requestHistoricalTimes(day, canvasId) {
  try {
    const date = dateToString(day);
    const url = `history?day=${date}&id=${canvasId}`;
    const response = await fetchWithTimeout(url, {
      timeout: 45000,
    });
    if (response.status !== 200) {
      return [];
    }
    const times = await response.json();
    const parsedTimes = times
      .map((a) => `${a.substring(0, 2)}:${a.substring(2)}`);
    return [
      '00:00',
      ...parsedTimes,
    ];
  } catch {
    return [];
  }
}

export function requestPasswordChange(newPassword, password) {
  return makeAPIPOSTRequest(
    'api/auth/change_passwd',
    { password, newPassword },
  );
}

export async function requestResendVerify() {
  return makeAPIGETRequest(
    'api/auth/resend_verify',
  );
}

export async function requestLogOut() {
  const ret = makeAPIGETRequest(
    'api/auth/logout',
  );
  return !ret.errors;
}

export function requestNameChange(name) {
  return makeAPIPOSTRequest(
    'api/auth/change_name',
    { name },
  );
}

export function requestMailChange(email, password) {
  return makeAPIPOSTRequest(
    'api/auth/change_mail',
    { email, password },
  );
}

export function requestLogin(nameoremail, password) {
  return makeAPIPOSTRequest(
    'api/auth/local',
    { nameoremail, password },
  );
}

export function requestRegistration(name, email, password, captcha, captchaid) {
  return makeAPIPOSTRequest(
    'api/auth/register',
    {
      name, email, password, captcha, captchaid,
    },
  );
}

export function requestNewPassword(email) {
  return makeAPIPOSTRequest(
    'api/auth/restore_password',
    { email },
  );
}

export function requestDeleteAccount(password) {
  return makeAPIPOSTRequest(
    'api/auth/delete_account',
    { password },
  );
}

export function requestRankings() {
  return makeAPIGETRequest(
    'ranking',
  );
}

export function requestMe() {
  return makeAPIGETRequest(
    'api/me',
  );
}
