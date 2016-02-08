import * as ActionTypes from '../constants/ActionTypes';

const initialState = { type: 'move' };

export function tool(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.CHANGE_TOOL:
      return { type: action.tool };
    default:
      return state;
  }
}
