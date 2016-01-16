import { SET_COLOR } from '../constants/ActionTypes';

/**
 * rgb = { a, r, g, b }
 */
export function setColor(rgb) {
  return { type: SET_COLOR, value: rgb };
}
