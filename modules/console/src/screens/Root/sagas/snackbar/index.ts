import { call, put, take, select, race } from 'redux-saga/effects';

import {
  showSnackback,
  popSnackbar,
  PUSH_SNACKBAR,
  CLOSE_SNACKBAR,
} from '../../../../actions/snackbar';

import { State } from '../../../../reducers';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function* watchSnackbar() {
  while (true) {
    yield take(PUSH_SNACKBAR);
    yield put(showSnackback(true));

    while(true) {
      yield put(popSnackbar());
      const current = yield select<State>(state => state.snackbar.current);
      const timeout = current && current.timeout || 3000;

      yield race({
        timeout: call(sleep, timeout),
        cancel: take(CLOSE_SNACKBAR),
      });

      const queue = yield select<State>(state => state.snackbar.next);
      if (queue.length === 0) {
        yield put(showSnackback(false));
        break;
      }
    }
  }
}
