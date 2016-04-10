import { Action } from '../actions';
import { LOADING_DONE } from '../actions/loading';

import { LOCATION_CHANGE } from 'react-router-redux';

// Set to true while loading initial scripts
const initialState = true;

export default function loading(state = initialState, action: Action<string>): boolean {
  switch(action.type) {
    case LOCATION_CHANGE: {
      return true;
    }
    case LOADING_DONE: {
      return false;
    }
    default: {
      return state;
    }
  }
}
