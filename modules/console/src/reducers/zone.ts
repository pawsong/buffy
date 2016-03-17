import StateLayer from '@pasta/core/lib/StateLayer';

import update from '../utils/update';
import { Action } from '../actions';
import {
  REQUEST_ZONE_CONNECT,
  ZONE_CONNECT_SUCCEEDED, ZoneConnectSucceededAction,
} from '../actions/zone';

export interface ZoneState {
  stateLayer: StateLayer;
}

const initialState: ZoneState = {
  stateLayer: null,
};

export default function zone(state = initialState, action: Action<string>): ZoneState {
  switch(action.type) {
    case ZONE_CONNECT_SUCCEEDED: {
      const { stateLayer } = <ZoneConnectSucceededAction>action;
      return update(state, {
        stateLayer,
      });
    }
    default: {
      return state;
    }
  }
}
