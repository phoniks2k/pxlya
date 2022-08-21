/*
 * state for single-window page (popup)
 */

const initialState = {
  // windowType: null,
  windowType: 'SETTINGS',
  title: '',
  args: {},
  isPopup: window.opener && !window.opener.closed,
};

export default function win(
  state = initialState,
  action,
) {
  switch (action.type) {
    default:
      return state;
  }
}
