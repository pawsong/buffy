export enum ToolType {
  move,
  editTerrain,
}

export interface Color {
  r: number; g: number; b: number;
}

export interface GameState {
  selectedTool?: ToolType,
  brushColor?: Color,
}
