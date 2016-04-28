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
export interface Position {
  x: number; y: number; z: number;
}

export interface Voxel {
  position: Position;
  color: Color;
}

export type Voxels = Immutable.Map<string, Voxel>;

export interface VoxelSnapshot {
  historyIndex: number;
  action: string;
  data: Voxels;
}

export interface VoxelState {
  historyIndex: number;
  past: VoxelSnapshot[];
  present: VoxelSnapshot;
  future: VoxelSnapshot[];
}

export interface VoxelEditorState {
  fileId?: string;
  selectedTool?: ToolType;
  paletteColor?: Color;
  voxel?: VoxelState;
}

/**
 * State observer
 */
export interface EditorStateListener {
  (editorState: VoxelEditorState): any;
}

export interface EditorStateSelector<T> {
  (editorState: VoxelEditorState): T;
}

export interface EditorStateObserver<T> {
  (state: T): any;
}

export interface RemoveObserver {
  (): void;
}

export interface ObserveEditorState {
  <T>(selector: EditorStateSelector<T>, listener: EditorStateObserver<T>): RemoveObserver;
}

export interface GetEditorState {
  (): VoxelEditorState;
}

export interface Services {
  container: HTMLElement;
  scene: THREE.Scene;
  controls: any;
  interact: any;
  dispatchAction: DispatchAction;
  getEditorState: GetEditorState;
  handleEditorStateChange: (nextState: VoxelEditorState) => any;
  observeEditorState: ObserveEditorState;
}
