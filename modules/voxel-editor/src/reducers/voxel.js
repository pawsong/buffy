import { ADD_VOXEL, LOAD_WORKSPACE } from '../constants/ActionTypes';
import Immutable from 'immutable';

import { vector3ToString } from '@pasta/helper-public';

const initialState = Immutable.Map();

export function voxel(state = initialState, action) {
  switch (action.type) {
    case ADD_VOXEL:
      const { position, color } = action;
      return state.set(vector3ToString(position), {
        position, color
      });
    case LOAD_WORKSPACE:
      return Immutable.Map(action.voxels);
    default:
      return state
  }
}

export function voxelOp(state = {}, action) {
  switch (action.type) {
    case ADD_VOXEL:
      return { type: ADD_VOXEL, voxel: action };
    case LOAD_WORKSPACE:
      return { type: LOAD_WORKSPACE };
    default:
      return state;
  }
}
