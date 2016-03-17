import { take, put, call, fork, cancel, select } from 'redux-saga/effects';
import { takeEvery } from 'redux-saga';

import { request } from '../saga';

import { State } from '../reducers';

import { ApiCall } from './core';
import {
  REQUEST_CALL, RequestCallAction,
  REFERENCE_CALL, ReferenceCallAction,
  API_REQUEST, ApiRequestAction,
  API_SUCCESS, ApiSuccessAction,
  API_FAILURE, ApiFailureAction,
} from './actions';

function* requestCall(apiCall: ApiCall<any>) {
  if (apiCall && apiCall.state === 'pending') {
    return;
  }

  yield put<ApiRequestAction>({
    type: API_REQUEST,
    callId: apiCall.id,
  });

  try {
    const response = yield call(request.default, <any>{
      method: apiCall.options.method,
      url: apiCall.options.url,
      params: apiCall.options.qs || {},
      body: apiCall.options.body || {},
    });

    yield put<ApiSuccessAction>({
      type: API_SUCCESS,
      callId: apiCall.id,
      result: response.data,
    });
  } catch(error) {
    yield put<ApiFailureAction>({
      type: API_FAILURE,
      callId: apiCall.id,
      error: error.message || 'Something bad happened',
    });
  }
}

export function* callApiOnServer(getState, apiCall: ApiCall<any>) {
  yield put<ReferenceCallAction>({
    type: REFERENCE_CALL,
    callId: apiCall.id,
    options: apiCall.options,
  });
  yield* requestCall(apiCall);
}

function* handleRequestCallAction(action: RequestCallAction) {
  const apiCall: ApiCall<any> = yield select<State>(state => state.api.calls.get(action.callId));
  if (!apiCall) {
    console.warn(`Cannot find apiCall '${action.callId}'`);
    return;
  }

  yield call(requestCall, apiCall);
}

export default function* watchCallApi() {
  yield* takeEvery(REQUEST_CALL, handleRequestCallAction as any);
}
