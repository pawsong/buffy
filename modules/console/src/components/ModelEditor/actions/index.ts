import { Ndarray } from 'ndarray';

import {
  Action,
  Color,
  Position,
  Voxel,
  Volumn,
  Transformation,
  ToolType,
  Rectangle,
  Axis,
} from '../types';

export const VOXEL_ADD: 'voxel-editor/VOXEL_ADD' = 'voxel-editor/VOXEL_ADD';
export interface VoxelAddAction extends Action<typeof VOXEL_ADD> {
  position: Position;
  color: Color;
}

export const VOXEL_ADD_BATCH_3D: 'VOXEL_ADD_BATCH_3D' = 'VOXEL_ADD_BATCH_3D';
export interface VoxelAddBatch3dAction extends Action<typeof VOXEL_ADD_BATCH_3D> {
  volumn: Volumn;
  color: Color;
}
export function voxelAddBatch3d(volumn: Volumn, color: Color): VoxelAddBatch3dAction {
  return {
    type: VOXEL_ADD_BATCH_3D,
    volumn,
    color,
  };
}

export const VOXEL_ADD_BATCH_2D: 'VOXEL_ADD_BATCH_2D' = 'VOXEL_ADD_BATCH_2D';
export interface VoxelAddBatch2dAction extends Action<typeof VOXEL_ADD_BATCH_2D> {
  volumn: Volumn;
  color: Color;
}
export function voxelAddBatch2d(volumn: Volumn, color: Color): VoxelAddBatch2dAction {
  return {
    type: VOXEL_ADD_BATCH_2D,
    volumn,
    color,
  };
}

export const VOXEL_ADD_LIST_2D: 'VOXEL_ADD_LIST_2D' = 'VOXEL_ADD_LIST_2D';
export interface VoxelAddList2dAction extends Action<typeof VOXEL_ADD_LIST_2D> {
  positions: Position[];
  color: Color;
}
export function voxelAddList2d(positions: Position[], color: Color): VoxelAddList2dAction {
  return {
    type: VOXEL_ADD_LIST_2D,
    positions,
    color,
  };
}

export const VOXEL_ADD_LIST_3D: 'VOXEL_ADD_LIST_3D' = 'VOXEL_ADD_LIST_3D';
export interface VoxelAddList3dAction extends Action<typeof VOXEL_ADD_LIST_3D> {
  positions: Position[];
  color: Color;
}
export function voxelAddList3d(positions: Position[], color: Color): VoxelAddList3dAction {
  return {
    type: VOXEL_ADD_LIST_3D,
    positions,
    color,
  };
}

export const VOXEL_PAINT_2D = 'VOXEL_PAINT_2D';
export function voxelPaint2d(positions: Position[], color: Color): VoxelAddList2dAction {
  const action = voxelAddList2d(positions, color);
  action.alias = VOXEL_PAINT_3D;
  return action;
}

export const VOXEL_PAINT_3D = 'VOXEL_PAINT_3D';
export function voxelPaint3d(positions: Position[], color: Color): VoxelAddList3dAction {
  const action = voxelAddList3d(positions, color);
  action.alias = VOXEL_PAINT_3D;
  return action;
}

export const VOXEL_SELECT_PROJECTION: 'VOXEL_SELECT_PROJECTION' = 'VOXEL_SELECT_PROJECTION';
export interface VoxelSelectProjectionAction extends Action<typeof VOXEL_SELECT_PROJECTION> {
  projectionMatrix: THREE.Matrix4;
  scale: number;
  bounds: Rectangle;
  merge: boolean;
}
export function voxelSelectProjection(
  projectionMatrix: THREE.Matrix4, scale: number, bounds: Rectangle, merge: boolean
): VoxelSelectProjectionAction {
  return {
    type: VOXEL_SELECT_PROJECTION,
    projectionMatrix,
    scale,
    bounds,
    merge,
  };
}

export const VOXEL_SELECT_BOX: 'VOXEL_SELECT_BOX' = 'VOXEL_SELECT_BOX';
export interface VoxelSelectBoxAction extends Action<typeof VOXEL_SELECT_BOX> {
  volumn: Volumn;
  merge: boolean;
}
export function voxelSelectBox(volumn: Volumn, merge: boolean): VoxelSelectBoxAction {
  return {
    type: VOXEL_SELECT_BOX,
    volumn,
    merge,
  };
}

export const VOXEL_SELECT_CONNECTED_2D: 'VOXEL_SELECT_CONNECTED_2D' = 'VOXEL_SELECT_CONNECTED_2D';
export interface VoxelSelectConnected2dAction extends Action<typeof VOXEL_SELECT_CONNECTED_2D> {
  position: Position;
  merge: boolean;
}
export function voxelSelectConnected2d(x: number, y: number, z: number, merge: boolean): VoxelSelectConnected2dAction {
  return {
    type: VOXEL_SELECT_CONNECTED_2D,
    position: [x, y, z],
    merge,
  };
}

export const VOXEL_SELECT_CONNECTED_3D: 'VOXEL_SELECT_CONNECTED' = 'VOXEL_SELECT_CONNECTED';
export interface VoxelSelectConnected3dAction extends Action<typeof VOXEL_SELECT_CONNECTED_3D> {
  position: Position;
  merge: boolean;
}
export function voxelSelectConnected(x: number, y: number, z: number, merge: boolean): VoxelSelectConnected3dAction {
  return {
    type: VOXEL_SELECT_CONNECTED_3D,
    position: [x, y, z],
    merge,
  };
}

export const VOXEL_MAGIN_WAND_2D: 'VOXEL_MAGIN_WAND_2D' = 'VOXEL_MAGIN_WAND_2D';
export interface VoxelMaginWand2dAction extends Action<typeof VOXEL_MAGIN_WAND_2D> {
  position: Position;
  merge: boolean;
}
export function voxelMaginWand2d(x: number, y: number, z: number, merge: boolean): VoxelMaginWand2dAction {
  return {
    type: VOXEL_MAGIN_WAND_2D,
    position: [x, y, z],
    merge,
  };
}

export const VOXEL_MAGIN_WAND_3D: 'VOXEL_MAGIN_WAND' = 'VOXEL_MAGIN_WAND';
export interface VoxelMaginWand3dAction extends Action<typeof VOXEL_MAGIN_WAND_3D> {
  position: Position;
  merge: boolean;
}
export function voxelMaginWand(x: number, y: number, z: number, merge: boolean): VoxelMaginWand3dAction {
  return {
    type: VOXEL_MAGIN_WAND_3D,
    position: [x, y, z],
    merge,
  };
}

export const VOXEL_COLOR_FILL_3D: 'VOXEL_COLOR_FILL' = 'VOXEL_COLOR_FILL';
export interface VoxelColorFill3dAction extends Action<typeof VOXEL_COLOR_FILL_3D> {
  position: Position;
  color: Color;
}
export function voxelColorFill3d(x: number, y: number, z: number, color: Color): VoxelColorFill3dAction {
  return {
    type: VOXEL_COLOR_FILL_3D,
    position: [x, y, z],
    color,
  };
}

export const VOXEL_COLOR_FILL_2D: 'VOXEL_COLOR_FILL_2D' = 'VOXEL_COLOR_FILL_2D';
export interface VoxelColorFill2dAction extends Action<typeof VOXEL_COLOR_FILL_2D> {
  position: Position;
  color: Color;
}
export function voxelColorFill2d(x: number, y: number, z: number, color: Color): VoxelColorFill2dAction {
  return {
    type: VOXEL_COLOR_FILL_2D,
    position: [x, y, z],
    color,
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

export const VOXEL_REMOVE_LIST_2D: 'VOXEL_REMOVE_LIST_2D' = 'VOXEL_REMOVE_LIST_2D';
export interface VoxelRemoveList2dAction extends Action<typeof VOXEL_REMOVE_LIST_2D> {
  positions: Position[];
}
export function voxelRemoveList2d(positions: Position[]): VoxelRemoveList2dAction {
  return {
    type: VOXEL_REMOVE_LIST_2D,
    positions,
  };
}

export const VOXEL_REMOVE_LIST_3D: 'VOXEL_REMOVE_LIST_3D' = 'VOXEL_REMOVE_LIST_3D';
export interface VoxelRemoveList3dAction extends Action<typeof VOXEL_REMOVE_LIST_3D> {
  positions: Position[];
}
export function voxelRemoveList3d(positions: Position[]): VoxelRemoveList3dAction {
  return {
    type: VOXEL_REMOVE_LIST_3D,
    positions,
  };
}

export const VOXEL_REMOVE_SELECTED_3D: 'voxel-editor/VOXEL_REMOVE_SELECTED' = 'voxel-editor/VOXEL_REMOVE_SELECTED';
export interface VoxelRemoveSelectedAction extends Action<typeof VOXEL_REMOVE_SELECTED_3D> {
}
export function voxelRemoveSelected(): VoxelRemoveSelectedAction {
  return {
    type: VOXEL_REMOVE_SELECTED_3D,
  };
}

export const VOXEL_REMOVE_SELECTED_2D: 'VOXEL_REMOVE_SELECTED_2D' = 'VOXEL_REMOVE_SELECTED_2D';
export interface VoxelRemoveSelected2dAction extends Action<typeof VOXEL_REMOVE_SELECTED_2D> {
}
export function voxelRemoveSelected2d(): VoxelRemoveSelected2dAction {
  return {
    type: VOXEL_REMOVE_SELECTED_2D,
  };
}

export const VOXEL_CREATE_FRAGMENT: 'VOXEL_CREATE_FRAGMENT' = 'VOXEL_CREATE_FRAGMENT';
export interface VoxelCreateFragmentAction extends Action<typeof VOXEL_CREATE_FRAGMENT> {
  model: Ndarray;
  selection: Ndarray;
  fragment: Ndarray;
  fragmentOffset: Position;
}
export function voxelCreateFragment(
  model: Ndarray, selection: Ndarray, fragment: Ndarray, x: number, y: number, z: number
): VoxelCreateFragmentAction {
  return {
    type: VOXEL_CREATE_FRAGMENT,
    model,
    selection,
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

export const VOXEL_RESIZE: 'VOXEL_RESIZE' = 'VOXEL_RESIZE';
export interface VoxelResizeAction extends Action<typeof VOXEL_RESIZE> {
  size: Position;
  offset: Position;
}
export function voxelResize(
  width: number, height: number, depth: number,
  x: number, y: number, z: number
): VoxelResizeAction {
  return {
    type: VOXEL_RESIZE,
    size: [width, height, depth],
    offset: [x, y, z],
  };
}

export const VOXEL_TRANSFORM: 'VOXEL_TRANSFORM' = 'VOXEL_TRANSFORM';
export interface VoxelTransformAction extends Action<typeof VOXEL_TRANSFORM> {
  transform: Transformation;
}
export function voxelTransform(transform: Transformation): VoxelTransformAction {
  return {
    type: VOXEL_TRANSFORM,
    transform,
  };
}

export const VOXEL_COPY: 'VOXEL_COPY' = 'VOXEL_COPY';
export interface VoxelCopyAction extends Action<typeof VOXEL_COPY> {
  model: Ndarray;
  selection: Ndarray;
}
export function voxelCopy(model: Ndarray, selection: Ndarray): VoxelCopyAction {
  return {
    type: VOXEL_COPY,
    model,
    selection,
  };
}

export const VOXEL_PASTE: 'VOXEL_PASTE' = 'VOXEL_PASTE';
export interface VoxelPasteAction extends Action<typeof VOXEL_PASTE> {
  model: Ndarray;
  selection: Ndarray;
}
export function voxelPaste(model: Ndarray, selection: Ndarray): VoxelPasteAction {
  return {
    type: VOXEL_PASTE,
    model,
    selection,
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

export const ENTER_MODE_2D: 'ENTER_MODE_2D' = 'ENTER_MODE_2D';
export interface EnterMode2DAction extends Action<typeof ENTER_MODE_2D> {
}
export function enterMode2D(): EnterMode2DAction {
  return {
    type: ENTER_MODE_2D,
  };
}

export const LEAVE_MODE_2D: 'LEAVE_MODE_2D' = 'LEAVE_MODE_2D';
export interface LeaveMode2DAction extends Action<typeof LEAVE_MODE_2D> {
}
export function leaveMode2D(): LeaveMode2DAction {
  return {
    type: LEAVE_MODE_2D,
  };
}

export const MOVE_MODE_2D_PLANE: 'MOVE_MODE_2D_PLANE' = 'MOVE_MODE_2D_PLANE';
export interface MoveMode2DPlaneAction extends Action<typeof MOVE_MODE_2D_PLANE> {
  axis: Axis;
  position: number;
}
export function moveMode2dPlane(axis: Axis, position: number): MoveMode2DPlaneAction {
  return {
    type: MOVE_MODE_2D_PLANE,
    axis,
    position,
  };
}
