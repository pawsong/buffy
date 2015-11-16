import { FOCUS_SPRITE } from '../constants/ActionTypes';

const initialState = null;

export function spriteFocus(state = initialState, action) {
  switch (action.type) {
    case FOCUS_SPRITE:
      if (!action.position) { return null; }

      const { x, y, z } = action.position;
      if (state && state.x === x && state.y === y && state.z === z) {
        return state;
      }

      return { x, y, z };
    default:
      return state;
  }
}
