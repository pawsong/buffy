export enum ToolType {
  move,
  editTerrain,
}

export interface Color {
  r: number; g: number; b: number;
}

export interface WorldEditorState {
  playerId?: string,
  selectedTool?: ToolType,
  brushColor?: Color,
}

export interface GetState {
  (): WorldEditorState;
}
