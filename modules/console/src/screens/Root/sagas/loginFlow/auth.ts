import { take, put, call, fork, cancel, select } from 'redux-saga/effects'

import * as Promise from 'bluebird';
import * as axios from 'axios';
import {
  retrieveToken as retrieveFacebookToken,
} from './facebook';

import { request } from '../../../../saga';

export interface LoginResult {
  user: Object;
}

export function* loginWithFacebook() {
  // try {
  const result = yield call(retrieveFacebookToken);
  if (!result) { return; }

  const { data } = yield call(request.post, `${CONFIG_API_SERVER_URL}/login/facebook`, { token: result.token });
  return { user: data };
  // } catch(error) {
  //   console.log(error);
  // }
}

export function* logout() {
  return yield call(request.post, `${CONFIG_API_SERVER_URL}/logout`);
}
