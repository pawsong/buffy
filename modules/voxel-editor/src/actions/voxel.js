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

export function voxelUndo() {
  return { type: ActionTypes.VOXEL_UNDO };
}

export function voxelUndoSeek(historyIndex) {
  return { type: ActionTypes.VOXEL_UNDO_SEEK, historyIndex };
}

export function voxelRedo() {
  return { type: ActionTypes.VOXEL_REDO };
}

export function voxelRedoSeek(historyIndex) {
  return { type: ActionTypes.VOXEL_REDO_SEEK, historyIndex };
}
