import { SET_COLOR } from '../constants/ActionTypes';

const initialState = {
  r: 46, g: 204, b: 113,
};

export function color(state = initialState, action) {
  switch (action.type) {
    case SET_COLOR:
      return action.value;
    default:
      return state;
  }
}
