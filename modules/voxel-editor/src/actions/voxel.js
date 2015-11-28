import * as ActionTypes from '../constants/ActionTypes';

export function addVoxel(position, color) {
  return { type: ActionTypes.ADD_VOXEL, position, color };
}

export function addVoxels(voxels) {
  return { type: ActionTypes.ADD_VOXEL_BATCH, voxels };
}

export function removeVoxel(position) {
  return { type: ActionTypes.REMOVE_VOXEL, position };
}
