import * as ActionTypes from '../constants/ActionTypes';
import * as Tools from '../constants/Tools';
import objectAssign from 'object-assign';

const initialState = {
  type: Tools.BRUSH,
};

export function tool(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.CHANGE_TOOL:
      return objectAssign({}, action.tool);
    default:
      return state;
  }
}
