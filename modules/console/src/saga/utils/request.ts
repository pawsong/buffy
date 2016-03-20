import { take, put, call, fork, cancel, select } from 'redux-saga/effects'
import { State } from '../../reducers';
import update from '../../utils/update';
const objectAssign = require('object-assign');

import * as Promise from 'bluebird';
import * as axios from 'axios';

interface RequestOptions extends axios.InstanceOptions {
  params?: Object;
  data?: Object;
}

interface Request {
  (config: axios.RequestOptions): IterableIterator<{}>
}

let _request: Request;
if (__CLIENT__) {
  // Use cookie for token store
  _request = function* (config) {
    try {
      return yield call(axios as any, objectAssign({}, config, {
        withCredentials: true,
      }));
    } catch(response) {
      if (response.status && response.status >= 200 && response.status < 600) {
        return response;
      }
      throw new Error(`Unexpected ajax error (status=${response.status})`);
    }
  };
} else {
  // Convey token on header
  _request = function* (config) {
    const token = yield select<State>(state => state.auth.token);
    const _config = !token ? config : objectAssign({}, config, {
      headers: objectAssign({}, config.headers, {
        Authorization: `Bearer ${token}`,
      }),
    });
    try {
      return yield call(axios as any, _config);
    } catch(response) {
      if (response.status && response.status >= 200 && response.status < 600) {
        return response;
      }
      throw new Error(`Unexpected ajax error (status=${response.status})`);
    }
  };
}

const request = _request;

export default request;

export function* get(url: string, config: RequestOptions = {}) {
  return yield call(request, objectAssign({}, config, {
    method: 'get',
    url,
  }) as any);
}

export function* post(url: string, data: any, config: RequestOptions = {}) {
  return yield call(request, objectAssign({}, config, {
    method: 'post',
    url,
    data,
  }) as any);
}

export function* put(url: string, data: any, config: RequestOptions = {}) {
  return yield call(request, objectAssign({}, config, {
    method: 'put',
    url,
    data,
  }) as any);
}

// get(url: string, config?: any): axios.Promise;
// delete(url: string, config?: any): axios.Promise;
// head(url: string, config?: any): axios.Promise;
// post(url: string, data: any, config?: any): axios.Promise;
// put(url: string, data: any, config?: any): axios.Promise;
// patch(url: string, data: any, config?: any): axios.Promise;
