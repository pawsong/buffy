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
import * as Promise from 'bluebird';
declare const FB;

interface RetrieveTokenResult {
  token: string;
}

function handleResponse(response): RetrieveTokenResult {
  if (response.status !== 'connected') { return; }
  return { token: response.authResponse.accessToken };
}

async function getLoginStatus() {
  const response = await new Promise(resolve => FB.getLoginStatus(resolve));
  return handleResponse(response);
}

async function login() {
  const response = await new Promise(resolve => FB.login(resolve));
  return handleResponse(response);
}

export async function retrieveToken() {
  const result = await getLoginStatus();
  if (result) { return result; }
  return await login();
}

export default function* facebookLogin(email: string, password: string) {
  const result = yield call(retrieveToken);
  if (!result) return false;

  const response = yield call(request.post, `${CONFIG_API_SERVER_URL}/login/facebook`, { token: result.token });
  const user = response.data;

  yield put<UserAddAction>({
    type: USER_ADD,
    user: {
      id: user['id'],
      email: user.email || '',
      name: user.name || '',
      username: user['username'] || '',
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
