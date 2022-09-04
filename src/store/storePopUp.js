/*
 * redux store for popups
 */

/* eslint-disable no-console */

import {
  applyMiddleware, createStore, combineReducers,
} from 'redux';
import thunk from 'redux-thunk';

/*
 * reducers
 */
import sharedReducers from './sharedReducers';
import canvas from './reducers/canvas';
import popup from './reducers/popup';

/*
 * middleware
 */
import parent from './middleware/parent';
import titlePopUp from './middleware/titlePopUp';

const reducers = combineReducers({
  ...sharedReducers,
  canvas,
  popup,
});

const store = createStore(
  reducers,
  applyMiddleware(
    thunk,
    parent,
    titlePopUp,
  ),
);

/*
 * persistStore of redux-persist is called in popup.js
 */

export default store;
