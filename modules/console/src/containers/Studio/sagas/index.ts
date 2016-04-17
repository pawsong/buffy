import { call, fork, put, take, race, select, cancel } from 'redux-saga/effects';
import { isCancelError } from 'redux-saga';

import StateLayer from '@pasta/core/lib/StateLayer';

import Blockly from '../../../blockly';
import { Sandbox, Scripts } from '../../../sandbox';

import {
  pushSnackbar,
} from '../../../actions/snackbar';

import { State } from '../../../reducers';

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

function* loadFriends() {
  const response = yield call(request.get, `${CONFIG_GAME_SERVER_URL}/friends`);
  const data = <any[]>response.data;
  yield put<UsersFetchedAction>({
    type: USERS_FETCHED,
    users: data.map(datum => ({
      id: datum._id,
      name: datum.name,
      home: datum.home,
      owner: datum.owner,
      mesh: datum.mesh,
      loc: datum.loc,
    })),
  });
}

/*
 * Game container sagas
 */

function* watchFriendsDialog() {
  yield* takeLatest(OPEN_FRIENDS_DIALOG, loadFriends);
}

function* watchWarpRequest() {
  try {
    while(true) {
      const action: RequestWarpAction = yield take(REQUEST_WARP);
      yield call(rpc.moveMap, { id: action.targetMapId });
      yield put(closeFriendsDialog());
    }
  } catch(error) {
    if (!isCancelError(error)) {
      console.log('watchWarpRequest', error);
    }
  }
}

/*
 * Code editor container sagas
 */

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

/*
 * Voxel editor container sagas
 */

export default function* studioRootSaga() {
  try {
    yield [
      call(watchFriendsDialog),
      call(watchWarpRequest),
    ]
  } catch(error) {
    if (!isCancelError(error)) {
      console.log('studioRootSaga', error);
    }
  }
}
