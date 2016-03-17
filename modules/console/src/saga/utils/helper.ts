import { isCancelError } from 'redux-saga';
import { take, put, call as _call, fork, cancel, select } from 'redux-saga/effects'

/**
 * takeLatest that cancels subtask on cancellation
 */
export function* takeLatest(pattern, saga) {
  let lastTask;
  try {
    while (true) {
      const action = yield take(pattern);
      if (lastTask) { yield cancel(lastTask); }
      lastTask = yield fork(saga, action);
    }
  } catch (error) {
    if (lastTask) { yield cancel(lastTask); }
    if (!isCancelError(error)) {
      throw error;
    }
  }
}
