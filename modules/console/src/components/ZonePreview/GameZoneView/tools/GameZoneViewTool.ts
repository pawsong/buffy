import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import GameZoneView from '../GameZoneView';

import {
  ToolType,
  GameState,
} from '../../interface';

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

abstract class GameZoneViewToolState<T> extends ToolState<T, GameState> {
  static EVENT_MOUSEUP = 'mouseup';
  static EVENT_MOUSEDOWN = 'mousedown';

  constructor(eventHandlers?: EventHandlers) {
    super(eventHandlers);
    this.eventHandlers[GameZoneViewToolState.EVENT_MOUSEUP] = this.onMouseUp.bind(this);
    this.eventHandlers[GameZoneViewToolState.EVENT_MOUSEDOWN] = this.onMouseDown.bind(this);
  }

  isIntersectable(object) {
    return false;
  }

  onMouseUp(params: MouseUpParams): HandlerResult { }
  onMouseDown(params: MouseDownParams): HandlerResult { }
}

interface GameZoneViewToolStates {
  [index: string]: GameZoneViewToolState<any>;
}

export { GameZoneViewToolState, GameZoneViewToolStates }

export interface InitParams {
  view: GameZoneView;
  stateLayer: StateLayer;
}

abstract class GameZoneViewTool extends Tool<GameState, ToolType, InitParams> {
  isIntersectable(object) {
    return (<GameZoneViewToolState<any>>this.fsm.current).isIntersectable(object);
  }

  onMouseUp(params: MouseUpParams) {
    this.fsm.trigger(GameZoneViewToolState.EVENT_MOUSEUP, params);
  }

  onMouseDown(params: MouseDownParams) {
    this.fsm.trigger(GameZoneViewToolState.EVENT_MOUSEDOWN, params);
  }
}

export default GameZoneViewTool;
