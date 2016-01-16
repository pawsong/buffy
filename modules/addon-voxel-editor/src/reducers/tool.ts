declare const require;

import * as ActionTypes from '../constants/ActionTypes';
import * as Tools from '../constants/Tools';
const objectAssign: any = require('object-assign');

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
