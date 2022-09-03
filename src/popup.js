/*
 * Main Script for windows (pop-ups and stuff)
 */

import store from './store/storePopUp';
import {
  urlChange,
} from './store/actions';

import renderAppPopUp from './components/AppPopUp';

function init() {
  window.addEventListener('popstate', () => {
    store.dispatch(urlChange());
  });
}
init();

document.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-console
  console.log('hello');
  renderAppPopUp(document.getElementById('app'), store);
});
