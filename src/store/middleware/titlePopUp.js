/*
 * set URL and querys in pupup window
 */
import { buildPopUpUrl } from '../../components/windows/popUpAvailable';

export default (store) => (next) => (action) => {
  const ret = next(action);

  switch (action.type) {
    case 'SET_WIN_TITLE': {
      const { windowType } = store.getState().popup;
      const { title } = action;
      const name = windowType[0] + windowType.substring(1).toLowerCase();
      document.title = (title) ? `${name} - ${title}` : name;
      break;
    }

    case 'SET_WIN_ARGS': {
      const {
        args,
        windowType,
      } = store.getState().popup;
      const url = buildPopUpUrl(windowType, args);
      window.history.pushState({}, undefined, url);
      break;
    }

    default:
      // nothing
  }

  return ret;
};
