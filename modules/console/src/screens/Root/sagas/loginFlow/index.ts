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

function* waitLogout() {
  while(true) {
    yield take(REQUEST_LOGOUT);

    try {
      yield call(logout);
    } catch(error) {
      yield put<LogoutErrorAction>({ type: LOGOUT_ERROR, error });
      continue;
    }

    yield put<LogoutSucceededAction>({ type: LOGOUT_SUCCEEDED });
    yield put(replace('/login'));
  }
}

export default function* watchLoginFlow() {
  yield fork(waitLogout);
}
