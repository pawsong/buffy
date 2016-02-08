import * as ActionTypes from '../constants/ActionTypes';

const initialState = {
  color: { r: 46, g: 204, b: 113 },
};

export function brush(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.CHANGE_COLOR:
      return { color: action.color };
    default:
      return state;
  }
}
