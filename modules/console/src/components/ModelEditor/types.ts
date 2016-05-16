import * as THREE from 'three';

/**
 * Flux
 */

export interface Action<T> {
  type: T;
}

export interface DispatchAction {
  <T>(action: Action<T>): any;
}

/**
 *
 */
export enum ToolType {
  brush,
  erase,
  colorize,
}

export interface Color {
  r: number; g: number; b: number;
}

/**
 * Voxel state
 */
export type Position = [number /* x */, number /* y */, number /* z */];

export interface Voxel {
  position: Position;
  color: Color;
}

export type Voxels = Immutable.Map<Immutable.Iterable.Indexed<number> /* Position */, Voxel>;

export interface VoxelSnapshot {
  historyIndex: number;
  action: string;
  data: Voxels;
  mesh: any;
}

export interface VoxelState {
  historyIndex: number;
  past: VoxelSnapshot[];
  present: VoxelSnapshot;
  future: VoxelSnapshot[];
}

export interface ModelEditorState {
  fileId?: string;
  image?: { url: string };
  selectedTool?: ToolType;
  paletteColor?: Color;
  voxel?: VoxelState;
}

/**
 * State observer
 */
export interface GetEditorState {
  (): ModelEditorState;
}
