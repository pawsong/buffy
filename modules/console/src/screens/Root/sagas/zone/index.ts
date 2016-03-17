import { call, put, take } from 'redux-saga/effects';
import * as io from 'socket.io-client';
import { InitParams } from '@pasta/core/lib/packet/ZC';
import StateLayer from '@pasta/core/lib/StateLayer';

import {
  REQUEST_ZONE_CONNECT,
  ZONE_CONNECT_SUCCEEDED, ZoneConnectSucceededAction,
} from '../../../../actions/zone';

export default function* () {
  const action = yield take(REQUEST_ZONE_CONNECT);

  // Try to connect
  const socket = io(CONFIG_GAME_SERVER_URL);

  // TODO: Error handling
  const params: InitParams = yield call(() => new Promise<InitParams>(resolve => {
    socket.once('init', params => resolve(params));
  }));

  const stateLayer = new StateLayer({
    emit: (event, params, cb) => {
      socket.emit(event, params, cb);
    },
    listen: (event, handler) => {
      socket.addEventListener(event, handler);
      return () => socket.removeEventListener(event, handler);
    },
    update: (callback) => {
      let frameId = requestAnimationFrame(update);
      let then = Date.now();
      function update() {
        const now = Date.now();
        callback(now - then);
        then = now;
        frameId = requestAnimationFrame(update);
      }
      return () => cancelAnimationFrame(frameId);
    },
  }, params);

  yield put<ZoneConnectSucceededAction>({ type: ZONE_CONNECT_SUCCEEDED, stateLayer });


  // When connection is ready, broadcast it
  // Wait disconnection
};
