export enum EditorMode {
  EDIT,
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
  cameraMode?: CameraMode;
  playerId?: string;
  selectedTool?: ToolType;
  brushColor?: Color;
}

export interface GetState {
  (): WorldEditorState;
}
