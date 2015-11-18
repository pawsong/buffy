import { vector3ToString } from '@pasta/helper-public';
import * as ActionTypes from '../constants/ActionTypes';
import Immutable from 'immutable';

import { getCameraId } from '../SpriteCameras';

const initialSprite = Immutable.Map();

export function sprite(state = initialSprite, action) {
  switch (action.type) {
    case ActionTypes.FILL_SPRITE:
      const planeId = getCameraId(action.front, action.up);

      const plane = state.get(planeId) || Immutable.Map();
      const { position, color } = action;
      return state.set(planeId, plane.set(vector3ToString(position), {
        position, color,
      }));
    default:
      return state;
  }
}

export function spriteOp(state = {}, action) {
  switch (action.type) {
    case ActionTypes.FILL_SPRITE:
      return {
        type: ActionTypes.FILL_SPRITE,
        front: action.front,
        up: action.up,
        position: action.position,
        color: action.color,
      };
    default:
      return state;
  }
}

export function spriteFocus(state = null, action) {
  switch (action.type) {
    case ActionTypes.FOCUS_SPRITE:
      if (!action.position) { return null; }

      const { x, y, z } = action.position;
      return { x, y, z };
    default:
      return state;
  }
}
