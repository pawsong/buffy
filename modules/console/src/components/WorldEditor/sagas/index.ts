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

interface RunParams {
  objectId: string;
  codeIds: string[];
}

export interface CompiledCodes {
  [index: string]: Scripts;
}

function execSandbox(sandbox: Sandbox, codes: CompiledCodes, instances: RunParams[]) {
  const promise = Promise.all(instances.map(instance => {
    return Promise.all(instance.codeIds.map(codeId => {
      return sandbox.exec(instance.objectId, codes[codeId]);
    }));
  }));
  sandbox.emit('when_run');
  return promise;
}

// Should be cancellable
export function* runBlocklyWorkspace(sandbox: Sandbox, codes: CompiledCodes, instances: RunParams[]) {
  try {
    yield call(execSandbox, sandbox, codes, instances);
  } catch(error) {
    if (!isCancelError(error)) console.log('runBlocklyWorkspace', error);
  } finally {
    sandbox.reset();
  }
}

