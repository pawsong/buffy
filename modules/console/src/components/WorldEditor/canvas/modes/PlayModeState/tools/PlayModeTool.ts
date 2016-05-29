import StateLayer from '@pasta/core/lib/StateLayer';

import {
  PlayToolType,
} from '../../../../types';

import ModeTool, { ToolState, ToolStates, ModeToolUpdateParams } from '../../ModeTool';
export { ToolState, ToolStates, ModeToolUpdateParams }

import WorldEditorCanvas from '../../../WorldEditorCanvas';

export interface InitParams {
  view: WorldEditorCanvas;
  stateLayer: StateLayer;
}

abstract class PlayModeTool<P, S, T> extends ModeTool<PlayToolType, InitParams, P, S, T> {
  canvas: WorldEditorCanvas;
  stateLayer: StateLayer;

  onInit({ view, stateLayer }: InitParams) {
    this.canvas = view;
    this.stateLayer = stateLayer;
  }
}

export default PlayModeTool;
