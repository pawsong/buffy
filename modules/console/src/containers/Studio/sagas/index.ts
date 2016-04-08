import { call, fork, put, take, race, select, cancel } from 'redux-saga/effects';
import { isCancelError } from 'redux-saga';
import StateLayer from '@pasta/core/lib/StateLayer';
import { Blockly, Interpreter, Scope } from '../containers/CodeEditor/blockly';

import { State } from '../../../reducers';

import {
  OPEN_FRIENDS_DIALOG,
  closeFriendsDialog,
  USERS_FETCHED, UsersFetchedAction,
  REQUEST_WARP, RequestWarpAction,
} from '../../../actions/game';

import {
  REQUEST_RUN_BLOCKLY, RequestRunBlocklyAction,
} from '../../../actions/codeEditor';

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

// Should be cancellable
export function* runBlocklyWorkspace(stateLayer: StateLayer, workspace: any) {
  let running = true;

  function run() {
    const topBlocks: any[] = workspace.getTopBlocks();
    return Promise.all(topBlocks.map(block => {
    // TODO: Check top block is an event emitter
      if (block.type === 'when_run') {
        const code = Blockly.JavaScript.blockToCode(block);

        return new Promise((resolve, reject) => {
          const interpreter = new Interpreter(code, (instance, scope) => Scope.inject(instance, scope, {
            stateLayer: stateLayer,
            interpreter: instance,
          }, () => nextStep()));

          const nextStep = () => {
            if (!running) {
              return reject(new Error('Stopped'));
            }

            // Do not step when process is not running
            if (!interpreter.step()) {
              return resolve();
            }

            if (interpreter.paused_) {
              // Response will resume this interpreter
              return;
            }

            // TODO: Support detailed speed setting
            // TODO: Prevent halting vm on infinite loop
            nextStep();
            // setTimeout(nextStep, 0);
          };
          nextStep();
        });
      }
    }));
  }

  try {
    yield call(run);
  } catch(error) {
    running = false;
    if (!isCancelError(error)) {
      console.log('runBlocklyWorkspace', error);
    }
  }
}

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
