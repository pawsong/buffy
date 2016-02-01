import * as ActionTypes from '../constants/ActionTypes';

interface AUTH_STATE {
  triedToLogin: boolean;
  user: Object;
}

const initialState = {
  triedToLogin: false,
  user: null,
};

export default function auth(state = initialState, action): AUTH_STATE {
  switch (action.type) {
    case ActionTypes.AUTH_LOGIN_SUCCEED:
      return {
        triedToLogin: true,
        user: action.user,
      };
    case ActionTypes.AUTH_LOGIN_FAIL:
    case ActionTypes.AUTH_LOGOUT:
      return {
        triedToLogin: true,
        user: null,
      };
    default:
      return state;
  }
}
