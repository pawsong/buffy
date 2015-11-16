import { ADD_VOXEL } from '../constants/ActionTypes';

export function addVoxel(position, color) {
  return { type: ADD_VOXEL, position, color };
}
