import * as Immutable from 'immutable';
import { Ndarray } from 'ndarray';
import {
  Position,
  Direction,
} from '@pasta/core/lib/types';

export enum EditorMode {
  EDIT,
  PLAY,
}

export enum PlayModeState {
  READY,
  PLAY,
}

export enum CameraMode {
  ORHTOGRAPHIC,
  PERSPECTIVE,
}

export enum EditToolType {
  addBlock,
  eraseBlock,
  colorize,
}

export enum PlayToolType {
  move,
}

export interface Color {
  r: number; g: number; b: number;
}

export interface WorldEditorState {
  fileId?: string;
  mode?: EditorMode;
  playMode?: PlayModeState;
  cameraMode?: CameraMode;
  playerId?: string;
  editTool?: EditToolType;
  playTool?: PlayToolType;
  brushColor?: Color;
  robots?: { [index: string]: Robot };
  zones?: { [index: string]: Zone };
  activeZoneId?: string;
}

export interface GetState {
  (): WorldEditorState;
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
