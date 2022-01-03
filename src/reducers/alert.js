const initialState = {
  alertOpen: false,
  alertType: null,
  alertTitle: null,
  alertMessage: null,
  alertBtn: null,
};

export default function alert(
  state = initialState,
  action,
) {
  switch (action.type) {
    case 'ALERT': {
      const {
        title, text, icon, confirmButtonText,
      } = action;

      return {
        ...state,
        alertOpen: true,
        alertTitle: title,
        alertMessage: text,
        alertType: icon,
        alertBtn: confirmButtonText,
      };
    }

    case 'CLOSE_ALERT': {
      return {
        ...state,
        alertOpen: false,
      };
    }

    default:
      return state;
  }
}
