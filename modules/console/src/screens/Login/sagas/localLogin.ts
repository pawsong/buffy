import { take, put, call, fork, cancel, select } from 'redux-saga/effects';
import { replace } from 'react-router-redux';

import { request } from '../../../saga';
import { Action } from '../../../actions';
import {
  LoginType,
  REQUEST_LOGIN, RequestLoginAction,
  LOGIN_SUCCEEDED, LoginSucceededAction,
  LOGIN_FAILED, LoginFailedAction,
  LOGIN_ERROR, LoginErrorAction,
  REQUEST_LOGOUT, RequestLogoutAction,
  LOGOUT_SUCCEEDED, LogoutSucceededAction,
  LOGOUT_ERROR, LogoutErrorAction,
} from '../../../actions/auth';
import {
  USER_ADD, UserAddAction,
  USER_REMOVE, UserRemoveAction,
} from '../../../actions/users';

import { State } from '../../../reducers';

export default function* localLogin(email: string, password: string) {
  const response = yield call(request.post, `${CONFIG_API_SERVER_URL}/login/local`, { email, password });
  if (response.status !== 200) return false;

  const user = response.data;

  yield put<UserAddAction>({
    type: USER_ADD,
    user: {
      id: user['id'],
      email: user.email || '',
      name: user.name || '',
      username: user.username || '',
      picture: user['picture'],
    },
  });

  yield put<LoginSucceededAction>({
    type: LOGIN_SUCCEEDED,
    userid: user['id'],
    username: user['name'],
  });

  return true;
}
