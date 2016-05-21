import * as THREE from 'three';
import { Ndarray } from 'ndarray';

/**
 * Flux
 */

export interface Action<T> {
  type: T;
}

export interface DispatchAction {
  <T>(action: Action<T>): any;
}

export interface ActionListener {
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

export type Volumn = [
  number /* minX */, number /* maxX */,
  number /* minY */, number /* maxY */,
  number /* minZ */, number /* maxZ */
]

export interface VoxelSnapshot {
  historyIndex: number;
  action: string;
  data: Ndarray;
  mesh: any;
}

export interface VoxelState {
  historyIndex: number;
  past: VoxelSnapshot[];
  present: VoxelSnapshot;
  future: VoxelSnapshot[];
}

export interface CommonState {
  selectedTool: ToolType;
  paletteColor: Color;
}

export interface ModelEditorState {
  common?: CommonState;
  voxel?: VoxelState;
}

/**
 * State observer
 */
export interface GetEditorState {
  (): ModelEditorState;
}
