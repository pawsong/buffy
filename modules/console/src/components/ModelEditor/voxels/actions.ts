import {
  Action,
  Color,
  Position,
  Voxel,
} from '../types';

export const VOXEL_INIT: 'voxel-editor/VOXEL_INIT' = 'voxel-editor/VOXEL_INIT';
export interface VoxelInitAction extends Action<typeof VOXEL_INIT> {

}

export const VOXEL_UNDO: 'voxel-editor/VOXEL_UNDO' = 'voxel-editor/VOXEL_UNDO';
export interface VoxelUndoAction extends Action<typeof VOXEL_UNDO> {

}

export const VOXEL_UNDO_SEEK: 'voxel-editor/VOXEL_UNDO_SEEK' = 'voxel-editor/VOXEL_UNDO_SEEK';
export interface VoxelUndoSeekAction extends Action<typeof VOXEL_UNDO_SEEK> {
  historyIndex: number;
}
export function voxelUndoSeek(historyIndex: number): VoxelUndoSeekAction {
  return {
    type: VOXEL_UNDO_SEEK,
    historyIndex,
  };
}

export const VOXEL_REDO: 'voxel-editor/VOXEL_REDO' = 'voxel-editor/VOXEL_REDO';
export interface VoxelRedoAction extends Action<typeof VOXEL_REDO> {

}

export const VOXEL_REDO_SEEK: 'voxel-editor/VOXEL_REDO_SEEK' = 'voxel-editor/VOXEL_REDO_SEEK';
export interface VoxelRedoSeekAction extends Action<typeof VOXEL_REDO_SEEK> {
  historyIndex: number;
}
export function voxelRedoSeek(historyIndex: number): VoxelRedoSeekAction {
  return {
    type: VOXEL_REDO_SEEK,
    historyIndex,
  };
}

export const LOAD_WORKSPACE: 'voxel-editor/LOAD_WORKSPACE' = 'voxel-editor/LOAD_WORKSPACE';
export interface LoadWorkspaceAction extends Action<typeof LOAD_WORKSPACE> {
  voxels: any; // TODO: define type
}

export const VOXEL_ADD: 'voxel-editor/VOXEL_ADD' = 'voxel-editor/VOXEL_ADD';
export interface VoxelAddAction extends Action<typeof VOXEL_ADD> {
  position: Position;
  color: Color;
}

export const VOXEL_ADD_BATCH: 'voxel-editor/VOXEL_ADD_BATCH' = 'voxel-editor/VOXEL_ADD_BATCH';
export interface VoxelAddBatchAction extends Action<typeof VOXEL_ADD_BATCH> {
  voxels: Voxel[];
}
export function voxelAddBatch(voxels: Voxel[]): VoxelAddBatchAction {
  return {
    type: VOXEL_ADD_BATCH,
    voxels,
  };
}

export const VOXEL_REMOVE: 'voxel-editor/VOXEL_REMOVE' = 'voxel-editor/VOXEL_REMOVE';
export interface VoxelRemoveAction extends Action<typeof VOXEL_REMOVE> {
  position: Position;
}

export const VOXEL_REMOVE_BATCH: 'voxel-editor/VOXEL_REMOVE_BATCH' = 'voxel-editor/VOXEL_REMOVE_BATCH';
export interface VoxelRemoveBatchAction extends Action<typeof VOXEL_REMOVE_BATCH> {
  positions: Position[];
}
export function voxelRemoveBatch(positions: Position[]): VoxelRemoveBatchAction {
  return {
    type: VOXEL_REMOVE_BATCH,
    positions,
  };
}

export const VOXEL_ROTATE: 'voxel-editor/VOXEL_ROTATE' = 'voxel-editor/VOXEL_ROTATE';
export interface VoxelRotateAction extends Action<typeof VOXEL_ROTATE> {
  axis: string;
}
export function voxelRotate(axis: string) {
  return {
    type: VOXEL_ROTATE,
    axis,
  };
}

export const SET_WORKSPACE: 'voxel-editor/SET_WORKSPACE' = 'voxel-editor/SET_WORKSPACE';
export interface SetWorkspaceAction extends Action<typeof SET_WORKSPACE> {
}

export const UPDATE_WORKSPACE: 'voxel-editor/UPDATE_WORKSPACE' = 'voxel-editor/UPDATE_WORKSPACE';
export interface UpdateWorkspaceBrowserQuery {
  name?: boolean;
  voxels?: number;
}
export interface UpdateWorkspaceAction extends Action<typeof UPDATE_WORKSPACE> {
  query: UpdateWorkspaceBrowserQuery;
}
export function updateWorkspace(query: UpdateWorkspaceBrowserQuery): UpdateWorkspaceAction {
  return {
    type: UPDATE_WORKSPACE,
    query,
  };
}
