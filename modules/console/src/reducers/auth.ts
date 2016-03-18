const objectAssign = require('object-assign');
import update from '../utils/update';

import { Action } from '../actions';
import {
  DELETE_TOKEN,
  REQUEST_LOGIN, RequestLoginAction,
  LOGIN_SUCCEEDED, LoginSucceededAction,
  LOGIN_FAILED, LoginFailedAction,
  LOGIN_ERROR, LoginErrorAction,
  REQUEST_LOGOUT, RequestLogoutAction,
  LOGOUT_SUCCEEDED, LogoutSucceededAction,
  LOGOUT_ERROR, LogoutErrorAction,
  USERNAME_UPDATE, UsernameUpdateAction,
} from '../actions/auth';

export interface AuthState {
  userid: string;
  username: string;
  localLoginErrorMessage: string;
  facebookLoginErrorMessage: string;
  token: string; // Used on server only
}

interface User {
  picture: '',
}

const initialState: AuthState = {
  userid: '',
  username: '',
  localLoginErrorMessage: '',
  facebookLoginErrorMessage: '',
  token: '',
};

export default function auth(state: AuthState = initialState, action: Action<string>): AuthState {
  switch (action.type) {
    case DELETE_TOKEN: {
      return update(state, { token : '' });
    }
    case REQUEST_LOGIN: {
      return update(state, {
        localLoginErrorMessage: '',
        facebookLoginErrorMessage: '',
      });
    }
    case LOGIN_SUCCEEDED: {
      const { userid, username, token } = action as LoginSucceededAction;
      return update(state, {
        userid,
        username,
        token: token || '',
      });
    }
    case LOGIN_ERROR: {
      const { error } = action as LoginErrorAction;
      return update(state, {
        facebookLoginErrorMessage: error.message,
      });
    }
    case LOGOUT_SUCCEEDED: {
      return update(state, {
        userid: '',
        username: '',
      });
    }
    case USERNAME_UPDATE: {
      const { username } = <UsernameUpdateAction>action;
      return update(state, {
        username,
      })
    }
    default: {
      return state;
    }
  }
}
