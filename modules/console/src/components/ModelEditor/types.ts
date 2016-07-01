import THREE from 'three';
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
  MOVE_2D,
  MOVE_3D,
  RECTANGLE_SELECT_2D,
  RECTANGLE_SELECT_3D,
  MAGIC_WAND_2D,
  MAGIC_WAND_3D,
  PENCIL_2D,
  PENCIL_3D,
  ERASE_2D,
  ERASE_3D,
  PAINT_2D,
  PAINT_3D,
  COLOR_FILL_2D,
  COLOR_FILL_3D,
  LINE_2D,
  LINE_3D,
  RECTANGLE_2D,
  RECTANGLE_3D,
  COLORIZE_2D,
  COLORIZE_3D,
  BOX,
  BOX_SELECT,
  TRANSFORM,
  RESIZE,

  // Tools that are always running
  MODE2D,
}

export enum SupportFileType {
  MAGICA_VOXEL,
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

export type Rectangle = [
  number /* loX */, number /* loY */, number /* hiX */, number /* hiY */
]

export enum Axis {
  X, Y, Z,
}

export interface VoxelData {
  size: Position;
  model: Ndarray;
  selection: Ndarray;
  fragment: Ndarray;
  fragmentOffset: Position;
  mode2D: {
    enabled: boolean;
    axis: Axis;
    position: number;
  };
}

export interface ExtraData {
  camera: THREE.OrthographicCamera;
}

export type FileState = UndoableState<VoxelData>;

export interface Clipboard {
  model: Ndarray;
  selection: Ndarray;
}

export interface CommonState {
  tool3d: ToolType;
  tool2d: ToolType;
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
