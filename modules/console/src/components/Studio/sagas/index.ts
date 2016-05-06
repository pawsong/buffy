import { call, fork, put, take, race, select, cancel } from 'redux-saga/effects';
import { isCancelError } from 'redux-saga';

import StateLayer from '@pasta/core/lib/StateLayer';

import { Sandbox, Scripts } from '../../../sandbox';

import {
  pushSnackbar,
} from '../../../actions/snackbar';

import {
  OPEN_FRIENDS_DIALOG,
  closeFriendsDialog,
  USERS_FETCHED, UsersFetchedAction,
  REQUEST_WARP, RequestWarpAction,
} from '../../../actions/game';

import {
  request,
  rpc,
  takeLatest,
} from '../../../saga';

function execSandbox(sandbox: Sandbox, scripts: Scripts) {
  const promise = sandbox.exec(scripts);
  sandbox.emit('when_run');
  return promise;
}

// Should be cancellable
export function* runBlocklyWorkspace(sandbox: Sandbox, scripts: Scripts) {
  try {
    yield call(execSandbox, sandbox, scripts);
  } catch(error) {
    if (!isCancelError(error)) console.log('runBlocklyWorkspace', error);
  } finally {
    sandbox.reset();
  }
}

