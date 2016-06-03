import * as THREE from 'three';
import { Ndarray } from 'ndarray';
import { UndoableState } from '@pasta/helper/lib/undoable';
import { SimpleStore } from '../../libs';

/**
 * Flux
 */

export interface Action<T> {
  type: T;
  alias?: string;
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
  LINE,
  COLOR_FILL,
  RECTANGLE,
  PENCIL,
  PAINT,
  ERASE,
  COLORIZE,
  BOX,
  BOX_SELECT,
  RECTANGLE_SELECT,
  MAGIC_WAND,
  TRANSFORM,
  MOVE,
  RESIZE,
}

export type Transformation = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

export interface Color {
  r: number; g: number; b: number;
}

/**
 * Voxel state
 */
// TODO: Rename to Vector3
export type Position = [number /* x */, number /* y */, number /* z */];

export interface Voxel {
  position: Position;
  color: Color;
}

export type Volumn = [
  number /* minX */, number /* minY */, number /* minZ */,
  number /* maxX */, number /* maxY */, number /* maxZ */
]

export interface VoxelData {
  matrix: Ndarray;
  selection: Ndarray;
  fragment: Ndarray;
  size: Position;
  fragmentOffset: Position;
}

export interface ExtraData {
  camera: THREE.PerspectiveCamera;
}

export type FileState = UndoableState<VoxelData>;

export interface Clipboard {
  model: Ndarray;
  selection: Ndarray;
}

export interface CommonState {
  selectedTool: ToolType;
  paletteColor: Color;
  clipboard: Clipboard;
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
