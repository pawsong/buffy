import { ADD_VOXEL } from '../constants/ActionTypes';
import Immutable from 'immutable';

const initialState = Immutable.Map();

function positionToKey(pos) {
  return `${pos.x}_${pos.y}_${pos.z}`;
}

export function voxel(state = initialState, action) {
  switch (action.type) {
    case ADD_VOXEL:
      const { position, color } = action;
      return state.set(positionToKey(position), {
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
