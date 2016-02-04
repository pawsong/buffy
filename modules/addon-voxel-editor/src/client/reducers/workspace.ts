const objectAssign = require('object-assign');
import { SET_WORKSPACE } from '../constants/ActionTypes';

const initialState = {};

export function workspace(state = initialState, action) {
  switch (action.type) {
    case SET_WORKSPACE:
      return objectAssign({}, state, action.workspace);
    default:
      return state;
  }
}
