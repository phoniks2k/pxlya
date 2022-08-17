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

const AppWin = ({ store }) => (
  <Provider store={store}>
    <Style />
    <IconContext.Provider value={iconContextValue}>
      <UIWin />
    </IconContext.Provider>
  </Provider>
);

function renderAppWin(domParent, store) {
  const root = createRoot(domParent);
  root.render(<AppWin store={store} />);
}

export default renderAppWin;
