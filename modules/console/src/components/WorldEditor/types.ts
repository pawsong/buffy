import * as Immutable from 'immutable';

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

export enum ToolType {
  move,
  editTerrain,
}

export interface Color {
  r: number; g: number; b: number;
}

export interface WorldEditorState {
  mode?: EditorMode;
  playMode?: PlayModeState;
  cameraMode?: CameraMode;
  playerId?: string;
  selectedTool?: ToolType;
  brushColor?: Color;
}

export interface GetState {
  (): WorldEditorState;
}

export interface Robot {
  id: string;
  name: string;
  zone: string;
  recipe: string;
}

interface Block {
  color: Color;
}

export type Blocks = Immutable.Map<Immutable.Iterable.Indexed<number> /* Position */, Block>;

export interface Zone {
  id: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  blocks: Blocks;
}
