import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import WorldEditorCanvas from '../WorldEditorCanvas';

import {
  ToolType,
  WorldEditorState,
} from '../../types';

import Tool, {
  ToolState,
  EventHandlers,
  HandlerResult,
} from '../../../../libs/Tool';

export interface MouseUpParams {
  event: MouseEvent;
}

export interface MouseDownParams {
  event: MouseEvent;
}

abstract class WorldEditorCanvsToolState<T> extends ToolState<T, WorldEditorState> {
  static EVENT_MOUSEUP = 'mouseup';
  static EVENT_MOUSEDOWN = 'mousedown';

  constructor(eventHandlers?: EventHandlers) {
    super(eventHandlers);
    this.eventHandlers[WorldEditorCanvsToolState.EVENT_MOUSEUP] = this.onMouseUp.bind(this);
    this.eventHandlers[WorldEditorCanvsToolState.EVENT_MOUSEDOWN] = this.onMouseDown.bind(this);
  }

  isIntersectable(object) {
    return false;
  }

  onMouseUp(params: MouseUpParams): HandlerResult { }
  onMouseDown(params: MouseDownParams): HandlerResult { }
}

interface WorldEditorCanvsToolStates {
  [index: string]: WorldEditorCanvsToolState<any>;
}

export { WorldEditorCanvsToolState, WorldEditorCanvsToolStates }

export interface InitParams {
  view: WorldEditorCanvas;
  stateLayer: StateLayer;
}

abstract class WorldEditorCanvasTool extends Tool<WorldEditorState, ToolType, InitParams> {
  isIntersectable(object) {
    return (<WorldEditorCanvsToolState<any>>this.fsm.current).isIntersectable(object);
  }

  onMouseUp(params: MouseUpParams) {
    this.fsm.trigger(WorldEditorCanvsToolState.EVENT_MOUSEUP, params);
  }

  onMouseDown(params: MouseDownParams) {
    this.fsm.trigger(WorldEditorCanvsToolState.EVENT_MOUSEDOWN, params);
  }
}

export default WorldEditorCanvasTool;
