import { Ndarray } from 'ndarray';

import {
  Action,
  Color,
  Position,
  Voxel,
  Volumn,
  ToolType,
} from '../types';

export const VOXEL_ADD: 'voxel-editor/VOXEL_ADD' = 'voxel-editor/VOXEL_ADD';
export interface VoxelAddAction extends Action<typeof VOXEL_ADD> {
  position: Position;
  color: Color;
}

export const VOXEL_ADD_BATCH: 'voxel-editor/VOXEL_ADD_BATCH' = 'voxel-editor/VOXEL_ADD_BATCH';
export interface VoxelAddBatchAction extends Action<typeof VOXEL_ADD_BATCH> {
  volumn: Volumn;
  color: Color;
}
export function voxelAddBatch(volumn: Volumn, color: Color): VoxelAddBatchAction {
  return {
    type: VOXEL_ADD_BATCH,
    volumn,
    color,
  };
}

export const VOXEL_SELECT: 'VOXEL_SELECT' = 'VOXEL_SELECT';
export interface VoxelSelectAction extends Action<typeof VOXEL_SELECT> {
  selection: Ndarray;
}
export function voxelSelect(selection: Ndarray): VoxelSelectAction {
  return {
    type: VOXEL_SELECT,
    selection,
  };
}

export const VOXEL_SELECT_BOX: 'VOXEL_SELECT_BOX' = 'VOXEL_SELECT_BOX';
export interface VoxelSelectBoxAction extends Action<typeof VOXEL_SELECT_BOX> {
  volumn: Volumn;
}
export function voxelSelectBox(volumn: Volumn): VoxelSelectBoxAction {
  return {
    type: VOXEL_SELECT_BOX,
    volumn,
  };
}

export const VOXEL_MAGIN_WAND: 'VOXEL_MAGIN_WAND' = 'VOXEL_MAGIN_WAND';
export interface VoxelMaginWandAction extends Action<typeof VOXEL_MAGIN_WAND> {
  position: Position;
}
export function voxelMaginWand(x: number, y: number, z: number): VoxelMaginWandAction {
  return {
    type: VOXEL_MAGIN_WAND,
    position: [x, y, z],
  };
}

export const VOXEL_CLEAR_SELECTION: 'VOXEL_CLEAR_SELECTION' = 'VOXEL_CLEAR_SELECTION';
export interface VoxelClearSelection extends Action<typeof VOXEL_CLEAR_SELECTION> {
}
export function voxelClearSelection(): VoxelClearSelection {
  return {
    type: VOXEL_CLEAR_SELECTION,
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

export const VOXEL_REMOVE_SELECTED: 'voxel-editor/VOXEL_REMOVE_SELECTED' = 'voxel-editor/VOXEL_REMOVE_SELECTED';
export interface VoxelRemoveSelectedAction extends Action<typeof VOXEL_REMOVE_SELECTED> {
}
export function voxelRemoveSelected(): VoxelRemoveSelectedAction {
  return {
    type: VOXEL_REMOVE_SELECTED,
  };
}

export const VOXEL_ROTATE: 'voxel-editor/VOXEL_ROTATE' = 'voxel-editor/VOXEL_ROTATE';
export interface VoxelRotateAction extends Action<typeof VOXEL_ROTATE> {
  axis: string;
}
export function voxelRotate(axis: string): VoxelRotateAction {
  return {
    type: VOXEL_ROTATE,
    axis,
  };
}

export const VOXEL_CREATE_FRAGMENT: 'VOXEL_CREATE_FRAGMENT' = 'VOXEL_CREATE_FRAGMENT';
export interface VoxelCreateFragmentAction extends Action<typeof VOXEL_CREATE_FRAGMENT> {
  model: Ndarray;
  fragment: Ndarray;
  fragmentOffset: Position;
}
export function voxelCreateFragment(model: Ndarray, fragment: Ndarray, x: number, y: number, z: number): VoxelCreateFragmentAction {
  return {
    type: VOXEL_CREATE_FRAGMENT,
    model,
    fragment,
    fragmentOffset: [x, y, z],
  };
}

export const VOXEL_MOVE_FRAGMENT: 'VOXEL_MOVE_FRAGMENT' = 'VOXEL_MOVE_FRAGMENT';
export interface VoxelMoveFragmentAction extends Action<typeof VOXEL_MOVE_FRAGMENT> {
  offset: Position;
}
export function voxelMoveFragment(x: number, y: number, z: number): VoxelMoveFragmentAction {
  return {
    type: VOXEL_MOVE_FRAGMENT,
    offset: [x, y, z],
  };
}

export const VOXEL_MERGE_FRAGMENT: 'VOXEL_MERGE_FRAGMENT' = 'VOXEL_MERGE_FRAGMENT';
export interface VoxelMergeFragmentAction extends Action<typeof VOXEL_MERGE_FRAGMENT> {
}
export function voxelMergeFragment(): VoxelMergeFragmentAction {
  return {
    type: VOXEL_MERGE_FRAGMENT,
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

/*
 * actions for common state
 */
export const CHANGE_TOOL: 'CHANGE_TOOL' = 'CHANGE_TOOL';
export interface ChangeToolAction extends Action<typeof CHANGE_TOOL> {
  tool: ToolType;
}
export function changeTool(tool: ToolType) {
  return {
    type: CHANGE_TOOL,
    tool,
  };
}

export const CHANGE_PALETTE_COLOR: 'CHANGE_PALETTE_COLOR' = 'CHANGE_PALETTE_COLOR';
export interface ChangePaletteColorAction extends Action<typeof CHANGE_PALETTE_COLOR> {
  color: Color;
}
export function changePaletteColor(color: Color) {
  return {
    type: CHANGE_PALETTE_COLOR,
    color,
  };
}
