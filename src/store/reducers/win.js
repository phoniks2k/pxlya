/*
 * state for single-window page (popup)
 */

const initialState = {
  // windowType: null,
  windowType: 'SETTINGS',
  title: '',
  args: {},
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
