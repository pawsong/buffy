import { FOCUS_SPRITE } from '../constants/ActionTypes';

export function focusSprite(position) {
  return { type: FOCUS_SPRITE, position};
}
