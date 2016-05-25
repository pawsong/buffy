import * as THREE from 'three';
import { Ndarray } from 'ndarray';
import { UndoableState } from '@pasta/helper/lib/undoable';
import { SimpleStore } from '../../libs';

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
  rectangle,
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

export interface VoxelData {
  matrix: Ndarray;
  mesh: any;
}

export type CameraStore = SimpleStore<Position>;

export interface ExtraData {
  cameraPositionStore: CameraStore;
}

export type FileState = UndoableState<VoxelData>;

export interface CommonState {
  selectedTool: ToolType;
  paletteColor: Color;
}

export interface ModelEditorState {
  common?: CommonState;
  file?: FileState;
}

export interface SerializedData {
  data: Uint8Array;
  shape: any;
}

/**
 * State observer
 */
export interface GetEditorState {
  (): ModelEditorState;
}
