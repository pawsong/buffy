import * as ActionTypes from '../constants/ActionTypes';

export function focusSprite(position) {
  return { type: ActionTypes.FOCUS_SPRITE, position};
}

export function fillSprite(front, up, position, color) {
  return { type: ActionTypes.FILL_SPRITE, front, up, position, color };
}
