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

export const ADD_ZONE_BLOCK: 'ADD_ZONE_BLOCK' = 'ADD_ZONE_BLOCK';
export interface AddZoneBlockAction extends Action<typeof ADD_ZONE_BLOCK> {
  zoneId: string;
  x: number; y: number; z: number;
  color: Color;
}
export function addZoneBlock(zoneId: string, x: number, y: number, z: number, color: Color): AddZoneBlockAction {
  return {
    type: ADD_ZONE_BLOCK,
    zoneId,
    x, y, z,
    color,
  };
}

export const REMOVE_ZONE_BLOCK: 'REMOVE_ZONE_BLOCK' = 'REMOVE_ZONE_BLOCK';
export interface RemoveZoneBlockAction extends Action<typeof REMOVE_ZONE_BLOCK> {
  zoneId: string;
  x: number; y: number; z: number;
}
export function removeZoneBlock(zoneId: string, x: number, y: number, z: number): RemoveZoneBlockAction {
  return {
    type: REMOVE_ZONE_BLOCK,
    zoneId,
    x, y, z,
  };
}

export const RUN_SCRIPT: 'RUN_SCRIPT' = 'RUN_SCRIPT';
export interface RunScriptAction extends Action<typeof RUN_SCRIPT> {
}
export function runScript(): RunScriptAction {
  return {
    type: RUN_SCRIPT,
  };
}

export const STOP_SCRIPT: 'STOP_SCRIPT' = 'STOP_SCRIPT';
export interface StopScriptAction extends Action<typeof STOP_SCRIPT> {
}
export function stopScript(): StopScriptAction {
  return {
    type: STOP_SCRIPT,
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
