/*
 * Main Script for windows (pop-ups and stuff)
 */

import store from './store/storeWin';

import renderAppWin from './components/AppWin';

document.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-console
  console.log('hello');
  renderAppWin(document.getElementById('app'), store);
});
