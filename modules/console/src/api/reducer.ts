import * as Immutable from 'immutable';
import * as invariant from 'invariant';
import update from '../utils/update';
import { Action } from '../actions';
import {
  API_REQUEST, ApiRequestAction,
  API_SUCCESS, ApiSuccessAction,
  API_FAILURE, ApiFailureAction,
  REFERENCE_CALL, ReferenceCallAction,
  UNREFERENCE_CALL, UnreferenceCallAction,
  EXPIRE_PRELOAD,
} from './actions';

import { ApiCall, makeInitialApiCall } from './core';

type Calls = Immutable.Map<string, ApiCall<any>>;

export interface ApiState {
  preloadExpired: boolean;
  calls: Calls;
}

// export type ApiState = Immutable.Map<string, ApiCall<any>>;
const initialState: ApiState = {
  preloadExpired: false,
  calls: Immutable.Map<string, ApiCall<any>>(),
};

// const initialState: ApiState = Immutable.Map<string, ApiCall<any>>();

export function initialize(state?: ApiState): ApiState {
  if (!state) { return initialState; }
  return {
    preloadExpired: state.preloadExpired,
    calls: Immutable.Map<string, ApiCall<any>>(state.calls),
  };
}

function preloadExpired(state: boolean, action: Action<any>): boolean {
  switch(action.type) {
    case EXPIRE_PRELOAD: {
      return true;
    }
    default: {
      return state;
    }
  }
}

function calls(state: Calls, action: Action<any>): Calls {
  switch(action.type) {
    case REFERENCE_CALL: {
      const { callId, options } = <ReferenceCallAction>action;
      const call = state.get(callId) || makeInitialApiCall(callId, options);

      return state.set(callId, update(call, {
        refCount: __CLIENT__ ? call.refCount + 1 : 0, // Do not increase reference count for server rendering
      }));
    }
    case UNREFERENCE_CALL: {
      const { callIds } = <UnreferenceCallAction>action;
      return state.withMutations(mutable => {
        callIds.forEach(callId => {
          const call = state.get(callId);
          if (!call) {
            console.warn(`Cannot find call ${callId}`);
            return state;
          }

          const nextRefCount = call.refCount - 1;
          if (nextRefCount <= 0) {
            if (nextRefCount !== 0) {
              console.warn('minus ref count?');
            }
            mutable.remove(callId);
          } else {
            mutable.set(callId, update(call, {
              refCount: nextRefCount,
            }));
          }
        });
      });
    }
    case API_REQUEST: {
      const { callId } = <ApiRequestAction>action;
      const call = state.get(callId);

      if (!call) {
        console.warn(`Cannot find call ${callId}`);
        return state;
      }

      return state.set(callId, update(call, {
        state: 'pending',
      }));
    }
    case API_SUCCESS: {
      const { callId, result } = <ApiSuccessAction>action;
      const call = state.get(callId);
      if (!call) {
        // Unwatched
        return state;
      }
      return state.set(callId, update(call, {
        state: 'fulfilled',
        result,
      }));
    }
    case API_FAILURE: {
      const { callId, error } = <ApiFailureAction>action;
      const call = state.get(callId);
      if (!call) {
        // Unwatched
        return state;
      }
      return state.set(callId, update(call, {
        state: 'rejected',
        error,
      }));
    }
    default: {
      return state;
    }
  }
}

export default function api(state = initialState, action: Action<any>): ApiState {
  return {
    preloadExpired: preloadExpired(state.preloadExpired, action),
    calls: calls(state.calls, action),
  };
}
