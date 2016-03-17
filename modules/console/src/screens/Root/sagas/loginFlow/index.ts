import { take, put, call, fork, cancel, select } from 'redux-saga/effects';
import { routerMiddleware, replace } from 'react-router-redux';

import { Action } from '../../../../actions';
import {
  LoginType,
  REQUEST_LOGIN, RequestLoginAction,
  LOGIN_SUCCEEDED, LoginSucceededAction,
  LOGIN_FAILED, LoginFailedAction,
  LOGIN_ERROR, LoginErrorAction,
  REQUEST_LOGOUT, RequestLogoutAction,
  LOGOUT_SUCCEEDED, LogoutSucceededAction,
  LOGOUT_ERROR, LogoutErrorAction,
} from '../../../../actions/auth';
import {
  USER_ADD, UserAddAction,
  USER_REMOVE, UserRemoveAction,
} from '../../../../actions/users';

import { State } from '../../../../reducers';

import {
  LoginResult,
  loginWithFacebook,
  logout,
} from './auth';

function* waitLogin() {
  const { loginType }: RequestLoginAction = yield take(REQUEST_LOGIN);

  let result: LoginResult;

  try {
    switch(loginType) {
      case LoginType.Local: {
        break;
      }
      case LoginType.Facebook: {
        result = yield call(loginWithFacebook);
        break;
      }
      default: {
        throw new Error(`Invalid login type: ${loginType}`);
      }
    }
  } catch(error) {
    yield put<LoginErrorAction>({
      type: LOGIN_ERROR,
      loginType,
      error: new Error('Login failed'),
    });
    yield fork(waitLogin);
    return;
  }

  if (!result.user) {
    yield put<LoginFailedAction>({ type: LOGIN_FAILED });
    yield fork(waitLogin);
    return;
  }

  yield put<UserAddAction>({
    type: USER_ADD,
    user: {
      id: result.user['id'],
      picture: result.user['picture'],
    },
  });
  yield put<LoginSucceededAction>({
    type: LOGIN_SUCCEEDED,
    userid: result.user['id'],
    username: result.user['name'],
  });
  yield put(replace('/'));

  yield call(waitLogout);
}

function* waitLogout() {
  yield take(REQUEST_LOGOUT);
  try {
    yield call(logout);
  } catch(error) {
    yield put<LogoutErrorAction>({ type: LOGOUT_ERROR, error });
    yield fork(waitLogout);
    return;
  }

  yield put<LogoutSucceededAction>({ type: LOGOUT_SUCCEEDED });
  yield put(replace('/login'));

  yield call(waitLogin);
}

export default function* watchLoginFlow() {
  const loggedIn: boolean = yield select<State>(state => !!state.auth.userid);
  yield fork(loggedIn ? waitLogout : waitLogin);
}
