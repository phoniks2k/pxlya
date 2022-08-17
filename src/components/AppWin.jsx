/**
 * Main App
 */

import React from 'react';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { IconContext } from 'react-icons';

import Style from './Style';
import UIWin from './UIWin';

const iconContextValue = { style: { verticalAlign: 'middle' } };

const AppWin = () => (
  <>
    <Style />
    <IconContext.Provider value={iconContextValue}>
      <UIWin />
    </IconContext.Provider>
  </>
);

function renderAppWin(domParent, store) {
  const root = createRoot(domParent);
  root.render(
    <Provider store={store}>
      <AppWin />
    </Provider>,
  );
}

export default renderAppWin;
