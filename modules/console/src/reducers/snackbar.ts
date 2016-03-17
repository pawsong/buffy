import update = require('react-addons-update');

import { Action } from '../actions';
import {
  SHOW_SNACKBAR, ShowSnackbarAction,
  PUSH_SNACKBAR, PushSnackbarAction,
  POP_SNACKBAR,
} from '../actions/snackbar';

export interface SnackbarRequest {
  message: string;
}

export interface SnackbarState {
  open: boolean;
  current: SnackbarRequest;
  next: SnackbarRequest[];
}

const initialState: SnackbarState = {
  open: false,
  current: {
    message: '',
  },
  next: [],
};

export default function snackbar(state = initialState, action: Action<any>): SnackbarState {
  switch(action.type) {
    case PUSH_SNACKBAR: {
      const { query } = <PushSnackbarAction>(action);
      return update(state, {
        next: { $push: [query] }
      });
    }
    case POP_SNACKBAR: {
      if (state.next.length === 0) return state;
      const current = state.next[0];

      return update(state, {
        current: { $set: current },
        next: { $splice: [[0, 1]] },
      });
    }
    case SHOW_SNACKBAR: {
      // TODO: Possible memory leak (when using action callbacks)
      // have to clean up current property on close.
      const { open } = <ShowSnackbarAction>(action);
      return update(state, {
        open: { $set: open },
      });
    }
    default: {
      return state;
    }
  }
}
