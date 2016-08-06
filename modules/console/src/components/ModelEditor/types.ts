import THREE from 'three';
import Immutable from 'immutable';
import { Ndarray } from 'ndarray';
import { UndoableState } from '@pasta/helper/lib/undoable';
import { SimpleStore } from '../../libs';
import {
  ModelFileType,
  MaterialMapType,
} from '../../types';

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

export enum ToolType {
  MOVE,
  RECTANGLE_SELECT,
  MAGIC_WAND,
  PENCIL,
  ERASE,
  PAINT,
  COLOR_FILL,
  LINE,
  RECTANGLE,
  COLORIZE,
  BOX,
  BOX_SELECT,
  TRANSFORM,
  RESIZE,

  // Tools that are always running
  MODE2D,
  COLOR_PICKER,
}

export enum UniqueToolType {
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
}

export type ToolFilter = Immutable.Set<ToolType>;

export enum SupportFileType {
  MAGICA_VOXEL,
  QUBICLE,
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

export interface MaterialMaps {
  [index: number /* MaterialMapType */]: Ndarray;
}

/*
 * DO NOT CHANGE NAME OF THIS ENUM PROPERTIES.
 * THIS IS SAVED IN PERSISTENT FILES.
 */
export enum TroveItemType {
  BLUNT,
  SWORD,
  AXE,
  PISTOL,
  STAFF,
  BOW,
  SPEAR,
  MASK,
  HAT,
  HAIR,
  DECO, // (For cornerstone decorations)
  LAIR,
  DUNGEON,
}

export interface TroveMetaData {
  itemType: TroveItemType;
}

export interface VoxelData {
  type: ModelFileType;
  size: Position;
  maps: MaterialMaps;
  activeMap: MaterialMapType;
  selection: Ndarray;
  fragment: MaterialMaps;
  fragmentOffset: Position;
  mode2d: {
    enabled: boolean;
    initialized: boolean;
    axis: Axis;
    position: number;
  };
  trove: TroveMetaData;
}

export interface ExtraData {
  camera: THREE.OrthographicCamera;
}

export type FileState = UndoableState<VoxelData>;

export interface Clipboard {
  maps: MaterialMaps;
  selection: Ndarray;
}

export enum ColorPickerType {
  SIMPLE,
  ADVANCED,
}

export interface CommonState {
  tool: ToolType;
  paletteColors: {
    [index: number /* MaterialMapType */]: Color,
  };
  colorPicker: ColorPickerType;
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

export interface ImportResult {
  result?: Ndarray;
  error?: string;
}

export interface ExportResult {
  result?: Uint8Array;
  error?: string;
}
