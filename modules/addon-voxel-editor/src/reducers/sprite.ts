import vector3ToString from '@pasta/helper/lib/vector3ToString';
import * as ActionTypes from '../constants/ActionTypes';
import * as Immutable from 'immutable';

import { getCameraId } from '../SpriteCameras';

const initialSprite = Immutable.Map<string, any>();

export function sprite(state = initialSprite, action): Immutable.Map<string, any> {
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
    case ActionTypes.LOAD_WORKSPACE:
      return Immutable.Map<string, any>().withMutations(state => {
        Object.keys(action.sprites).forEach(key => {
          state.set(key, Immutable.Map(action.sprites[key]));
        });
      });
    default:
      return state;
  }
}

export function spriteOp(state = {}, action): {} {
  switch (action.type) {
    case ActionTypes.FILL_SPRITE:
      return {
        type: ActionTypes.FILL_SPRITE,
        front: action.front,
        up: action.up,
        position: action.position,
        color: action.color,
      };
    case ActionTypes.LOAD_WORKSPACE:
    case ActionTypes.FILL_SPRITE_BATCH:
      return {
        type: action.type,
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
