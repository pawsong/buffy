import { fork } from 'redux-saga/effects';

import watchLoginFlow from './loginFlow';
import watchZone from './zone';
import watchSnackbar from './snackbar';

export default function* rootSaga() {
  yield [
    fork(watchLoginFlow),
    fork(watchZone),
    fork(watchSnackbar),
  ]
};
