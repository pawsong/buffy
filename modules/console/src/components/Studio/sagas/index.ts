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
  const keyState = {};
  function keyEventListener(e: KeyboardEvent) {
    keyState[e.keyCode] = e.type === 'keydown';
  }
  window.addEventListener('keydown', keyEventListener, false);
  window.addEventListener('keyup', keyEventListener, false);

  let frameId;
  function update () {
    frameId = requestAnimationFrame(update);
    Object.keys(keyState).forEach(keyCode => {
      if (keyState[keyCode]) sandbox.emit(`keydown_${keyCode}`);
    })
  }
  frameId = requestAnimationFrame(update);

  try {
    yield call(execSandbox, sandbox, scripts);
  } catch(error) {
    if (!isCancelError(error)) console.log('runBlocklyWorkspace', error);
  } finally {
    cancelAnimationFrame(frameId);
    window.removeEventListener('keydown', keyEventListener, false);
    window.removeEventListener('keyup', keyEventListener, false);

    sandbox.reset();
  }
}

export function* submitVoxel(stateLayer: StateLayer, data: any) {
  yield call(stateLayer.rpc.updateMesh, {
    id: stateLayer.store.myId,
    vertices: data.vertices,
    faces: data.faces,
  });

  yield put(pushSnackbar({
    message: 'Mesh updated',
  }));
};
