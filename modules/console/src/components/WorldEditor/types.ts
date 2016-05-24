import * as Immutable from 'immutable';
import { Ndarray } from 'ndarray';
import {
  Position,
  Direction,
} from '@pasta/core/lib/types';

import { UndoableState } from '@pasta/helper/lib/undoable';

export interface Action<T> {
  type: T;
}

export interface DispatchAction {
  <T>(action: Action<T>): any;
}

export interface ActionListener {
  <T>(action: Action<T>): any;
}

export enum EditorMode {
  EDIT,
  PLAY,
}

export interface CommonState {
  mode: EditorMode;
}

export enum CameraMode {
  BIRDS_EYE,
  FIRST_PERSON,
}

export enum EditToolType {
  MOVE,
  ADD_BLOCK,
  REMOVE_BLOCK,
  COLORIZE,
  ADD_ROBOT,
}

export interface Color {
  r: number; g: number; b: number;
}

export interface Robot {
  id: string;
  name: string;
  recipe: string;
  zone: string;
  position: Position;
  direction: Direction;
}

export interface Zone {
  id: string;
  name: string;
  size: [number /* width */, number /* height */, number /* depth */];
  blocks: Ndarray;
}

export interface EditModeState {
  tool: EditToolType;
  paletteColor: Color;
  activeZoneId: string;
  addRobotRecipeId: string;
  toolToRestore: EditToolType;
  scriptIsRunning: boolean;
}

export enum PlayState {
  READY,
  PLAY,
}

export enum ViewMode {
  BIRDS_EYE,
  FIRST_PERSON,
}

export enum PlayToolType {
  MOVE,
}

export interface PlayModeState {
  state: PlayState;
  viewMode: ViewMode;
  tool: PlayToolType;
}

export interface WorldData {
  playerId: string;
  robots: { [index: string]: Robot };
  zones: { [index: string]: Zone };
}

export type FileState = UndoableState<WorldData>;

export interface WorldEditorState {
  common: CommonState,
  editMode: EditModeState,
  playMode: PlayModeState,
}

export interface WorldState {
  editor: WorldEditorState;
  file: WorldData;
}

export interface GetState {
  (): WorldEditorState;
}
