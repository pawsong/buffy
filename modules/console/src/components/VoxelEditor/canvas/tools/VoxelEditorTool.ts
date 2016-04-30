import * as THREE from 'three';
import MainCanvas from '../views/main';

import {
  ToolType,
  VoxelEditorState,
  DispatchAction,
} from '../../interface';

import { SetState } from '../types';

import Tool, {
  ToolState,
  EventHandlers,
  HandlerResult,
} from '../../../../libs/Tool';
export { HandlerResult }

export interface InteractParams {
  intersect: THREE.Intersection;
  event: MouseEvent;
}

export interface MouseUpParams {
  intersect: THREE.Intersection;
  event: MouseEvent;
}

export interface MouseDownParams {
  intersect: THREE.Intersection;
  event: MouseEvent;
}

abstract class VoxelEditorToolState<T> extends ToolState<T, VoxelEditorState> {
  static EVENT_INTERACT = 'interact';
  static EVENT_MOUSEUP = 'mouseup';
  static EVENT_MOUSEDOWN = 'mousedown';

  constructor(eventHandlers?: EventHandlers) {
    super(eventHandlers);
    this.eventHandlers[VoxelEditorToolState.EVENT_INTERACT] = this.onInteract.bind(this);
    this.eventHandlers[VoxelEditorToolState.EVENT_MOUSEUP] = this.onMouseUp.bind(this);
    this.eventHandlers[VoxelEditorToolState.EVENT_MOUSEDOWN] = this.onMouseDown.bind(this);
  }

  isIntersectable(object) {
    return false;
  }

  onInteract(params: InteractParams): HandlerResult { }
  onMouseUp(params: MouseUpParams): HandlerResult { }
  onMouseDown(params: MouseDownParams): HandlerResult { }
}

interface VoxelEditorToolStates {
  [index: string]: VoxelEditorToolState<any>;
}

export { VoxelEditorToolState, VoxelEditorToolStates }

export interface InitParams {
  view: MainCanvas;
  setState: SetState;
  dispatchAction: DispatchAction;
}

abstract class VoxelEditorTool extends Tool<VoxelEditorState, ToolType, InitParams> {
  isIntersectable(object) {
    return (<VoxelEditorToolState<any>>this.fsm.current).isIntersectable(object);
  }

  onInteract(params: InteractParams) {
    this.fsm.trigger(VoxelEditorToolState.EVENT_INTERACT, params);
  }

  onMouseUp(params: MouseUpParams) {
    this.fsm.trigger(VoxelEditorToolState.EVENT_MOUSEUP, params);
  }

  onMouseDown(params: MouseDownParams) {
    this.fsm.trigger(VoxelEditorToolState.EVENT_MOUSEDOWN, params);
  }
}

export default VoxelEditorTool;
