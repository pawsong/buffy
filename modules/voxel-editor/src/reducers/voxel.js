import { ADD_VOXEL } from '../constants/ActionTypes';
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
    default:
      return state
  }
}

export function voxelOp(state = {}, action) {
  switch (action.type) {
    case ADD_VOXEL:
      return { type: ADD_VOXEL, voxel: action };
    default:
      return state;
  }
}
