/*
 * redux store for popups
 */

/* eslint-disable no-console */

import {
  applyMiddleware, createStore, combineReducers,
} from 'redux';
import thunk from 'redux-thunk';
import { persistStore } from 'redux-persist';

/*
 * reducers
 */
import sharedReducers from './sharedReducers';
import canvas from './reducers/canvas';
import popup from './reducers/popup';
import user from './reducers/user';
import chat from './reducers/chat';
import fetching from './reducers/fetching';

/*
 * middleware
 */
import parent from './middleware/parent';
import titlePopUp from './middleware/titlePopUp';

const reducers = combineReducers({
  ...sharedReducers,
  canvas,
  popup,
  user,
  chat,
  fetching,
});

const store = createStore(
  reducers,
  applyMiddleware(
    thunk,
    parent,
    titlePopUp,
  ),
);

export const persistor = persistStore(store, {}, () => {
  window.addEventListener('message', store.dispatch);
  store.dispatch({ type: 'HYDRATED' });
});

export default store;
