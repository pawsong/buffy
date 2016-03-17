import { take, put, call, fork, cancel, select } from 'redux-saga/effects'
import { State } from '../../reducers';

import StateLayer from '@pasta/core/lib/StateLayer';
import { Rpc, Methods } from '@pasta/core/lib/packet/CZ';

const rpc: Rpc = <Rpc>{};
Object.keys(Methods).forEach(key => {
  const method = Methods[key];
  rpc[key] = function* rpcSaga(params) {
    const stateLayer: StateLayer = yield select<State>(state => state.zone.stateLayer);
    if (!stateLayer) {
      throw new Error('Rpc connection is not ready to use');
    }
    return yield call(stateLayer.rpc[key], params);
  }
});

export default rpc;
