/*
 * windows that can be opened as pop-up
 */

export const argsTypes = {
  USERAREA: ['activeTab'],
  CHAT: ['chatChannel'],
};

export function buildPopUpUrl(windowType, args) {
  let path = `/${windowType.toLowerCase()}`;
  const typeArr = argsTypes[windowType];
  for (let i = 0; i < typeArr.length; i += 1) {
    const key = typeArr[i];
    if (args[key]) {
      path += `/${args[key]}`;
      delete args[key];
    }
  }
  let searchParams = new URLSearchParams();
  const keys = Object.keys(args);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    searchParams.append(key, args[key]);
  }
  searchParams = searchParams.toString();
  if (searchParams) {
    path += `?${searchParams}`;
  }
  return path;
}

export default [
  'HELP',
  'SETTINGS',
  'USERAREA',
  'CHAT',
  'CANVAS_SELECTION',
  'ARCHIVE',
];
