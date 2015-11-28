import * as ActionTypes from '../constants/ActionTypes';
import Immutable from 'immutable';

import { vector3ToString } from '@pasta/helper-public';

const initialState = Immutable.Map();

export function voxel(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.ADD_VOXEL:
      {
        const { position, color } = action;
        return state.set(vector3ToString(position), {
          position, color
        });
      }
    case ActionTypes.ADD_VOXEL_BATCH:
      {
        const { voxels } = action;
        return state.withMutations(map => {
          voxels.forEach(voxel => {
            const { position, color } = voxel;
            map.set(vector3ToString(position), {
              position, color
            });
          });
        });
      }
    case ActionTypes.REMOVE_VOXEL:
      {
        const { position } = action;
        return state.remove(vector3ToString(position));
      }
    case ActionTypes.LOAD_WORKSPACE:
      return Immutable.Map(action.voxels);
    default:
      return state
  }
}

export function voxelOp(state = {}, action) {
  switch (action.type) {
    case ActionTypes.ADD_VOXEL:
    case ActionTypes.REMOVE_VOXEL:
      return { type: action.type, voxel: action };
    case ActionTypes.ADD_VOXEL_BATCH:
      return { type: action.type, voxels: action.voxels };
    case ActionTypes.LOAD_WORKSPACE:
      return { type: action.type };
    default:
      return state;
  }
}
