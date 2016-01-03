import * as ActionTypes from '../constants/ActionTypes';

export function changeTool(type, options) {
  return { type: ActionTypes.CHANGE_TOOL, tool: { type, options } };
}
