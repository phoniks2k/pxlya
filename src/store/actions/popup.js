/*
 * Actions taht are used only within popup
 */

export function setWindowArgs(args) {
  return {
    type: 'SET_WIN_ARGS',
    args,
  };
}

export function setWindowTitle(title) {
  return {
    type: 'SET_WIN_TITLE',
    title,
  };
}
