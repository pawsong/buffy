import { vector3ToString } from '@pasta/helper-public';
import * as ActionTypes from '../constants/ActionTypes';
import Immutable from 'immutable';

import { getCameraId } from '../SpriteCameras';

const initialSprite = Immutable.Map();

export function sprite(state = initialSprite, action) {
  switch (action.type) {
    case ActionTypes.FILL_SPRITE:
      const { position, color } = action;
      const planeId = getCameraId(action.front, action.up);
      const plane = state.get(planeId) || Immutable.Map();
      return state.set(planeId, plane.set(vector3ToString(position), {
        position, color,
      }));
    case ActionTypes.FILL_SPRITE_BATCH:
      const actionsByPlane = {};
      action.actions.forEach(item => {
        const { front, up } = item;
        const planeId = getCameraId(front, up);
        let actions = actionsByPlane[planeId];
        if (!actions) {
          actions = actionsByPlane[planeId] = [];
        }
        actions.push(item);
      });
      return state.withMutations(state => {
        Object.keys(actionsByPlane).forEach(planeId => {
          const actions = actionsByPlane[planeId];
          const prevPlane = state.get(planeId) || Immutable.Map();
          const plane = prevPlane.withMutations(plane => {
            actions.forEach(({ position, color }) => {
              plane.set(vector3ToString(position), {
                position, color,
              });
            });
          });
          state.set(planeId, plane);
        });
      });
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
    case ActionTypes.FILL_SPRITE_BATCH:
      return {
        type: ActionTypes.FILL_SPRITE_BATCH,
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
