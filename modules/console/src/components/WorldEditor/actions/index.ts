import {
  EditorMode,
  EditToolType,
  Color,
  PlayToolType,
  ViewMode,
  PlayState,
  Robot,
} from '../types';

export interface Action<T> {
  type: T;
}

export interface DispatchAction {
  <T>(action: Action<T>): any;
}

/*
 * actions for common state
 */
export const CHANGE_EDITOR_MODE: 'CHANGE_EDITOR_MODE' = 'CHANGE_EDITOR_MODE';
export interface ChangeEditorModeAction extends Action<typeof CHANGE_EDITOR_MODE> {
  mode: EditorMode;
}
export function changeEditorMode(mode: EditorMode): ChangeEditorModeAction {
  return {
    type: CHANGE_EDITOR_MODE,
    mode,
  };
}

/*
 * actions for edit mode state
 */
export const CHANGE_EDIT_TOOL: 'CHANGE_EDIT_TOOL' = 'CHANGE_EDIT_TOOL';
export interface ChangeEditToolAction extends Action<typeof CHANGE_EDIT_TOOL> {
  tool: EditToolType;
}
export function changeEditTool(tool: EditToolType): ChangeEditToolAction {
  return {
    type: CHANGE_EDIT_TOOL,
    tool,
  };
}

export const CHANGE_PALETTE_COLOR: 'CHANGE_PALETTE_COLOR' = 'CHANGE_PALETTE_COLOR';
export interface ChangePaletteColorAction extends Action<typeof CHANGE_PALETTE_COLOR> {
  color: Color;
}
export function changePaletteColor(color: Color): ChangePaletteColorAction {
  return {
    type: CHANGE_PALETTE_COLOR,
    color,
  };
}

export const CHANGE_ACTIVE_ZONE: 'CHANGE_ACTIVE_ZONE' = 'CHANGE_ACTIVE_ZONE';
export interface ChangeActiveZoneAction extends Action<typeof CHANGE_ACTIVE_ZONE> {
  zoneId: string;
}
export function changeActiveZone(zoneId: string): ChangeActiveZoneAction {
  return {
    type: CHANGE_ACTIVE_ZONE,
    zoneId,
  };
}

export const REQUEST_ADD_ROBOT: 'REQUEST_ADD_ROBOT' = 'REQUEST_ADD_ROBOT';
export interface RequestAddRobotAction extends Action<typeof REQUEST_ADD_ROBOT> {
  recipeId: string;
}
export function requestAddRobot(recipeId: string): RequestAddRobotAction {
  return {
    type: REQUEST_ADD_ROBOT,
    recipeId,
  };
}

export const ADD_ROBOT: 'ADD_ROBOT' = 'ADD_ROBOT';
export interface AddRobotAction extends Action<typeof ADD_ROBOT> {
  robot: Robot;
}
export function addRobot(robot: Robot): AddRobotAction {
  return {
    type: ADD_ROBOT,
    robot,
  };
}

export const REMOVE_ROBOT: 'REMOVE_ROBOT' = 'REMOVE_ROBOT';
export interface RemoveRobotAction extends Action<typeof REMOVE_ROBOT> {
  robotId: string;
}
export function removeRobot(robotId: string): RemoveRobotAction {
  return {
    type: REMOVE_ROBOT,
    robotId,
  };
}

/*
 * actions for play mode state
 */
export const CHANGE_PLAY_TOOL: 'CHANGE_PLAY_TOOL' = 'CHANGE_PLAY_TOOL';
export interface ChangePlayToolAction extends Action<typeof CHANGE_PLAY_TOOL> {
  tool: PlayToolType;
}
export function changePlayTool(tool: PlayToolType): ChangePlayToolAction {
  return {
    type: CHANGE_PLAY_TOOL,
    tool,
  };
}

export const CHANGE_PLAY_VIEW_MODE: 'CHANGE_PLAY_VIEW_MODE' = 'CHANGE_PLAY_VIEW_MODE';
export interface ChangePlayViewModeAction extends Action<typeof CHANGE_PLAY_VIEW_MODE> {
  viewMode: ViewMode;
}
export function changePlayViewMode(viewMode: ViewMode): ChangePlayViewModeAction {
  return {
    type: CHANGE_PLAY_VIEW_MODE,
    viewMode,
  };
}

export const CHANGE_PLAY_STATE: 'CHANGE_PLAY_STATE' = 'CHANGE_PLAY_STATE';
export interface ChangePlayStateAction extends Action<typeof CHANGE_PLAY_STATE> {
  playState: PlayState;
}
export function changePlayState(playState: PlayState): ChangePlayStateAction {
  return {
    type: CHANGE_PLAY_STATE,
    playState,
  };
}
