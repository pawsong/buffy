import StateLayer from '@pasta/core/lib/StateLayer';

import {
  WorldEditorState,
  PlayToolType,
  GetState,
} from '../../../types';

import ModeState from '../ModeState';
import WorldEditorCanvas from '../../WorldEditorCanvas';

import createTool, { PlayModeTool, InitParams } from './tools';

class PlayModeState extends ModeState<PlayToolType, InitParams> {
  private stateLayer: StateLayer;
  private canvas: WorldEditorCanvas;

  constructor(getState: GetState, initParams: InitParams) {
    super(getState, initParams);
    this.canvas = initParams.view;
    this.stateLayer = initParams.stateLayer;
  }

  getToolType(editorState: WorldEditorState): PlayToolType {
    return editorState.playTool;
  }

  // Lazy getter
  createTool(toolType: PlayToolType): PlayModeTool {
    return createTool(toolType, this.getState, {
      view: this.canvas,
      stateLayer: this.stateLayer,
    });
  }
}

export default PlayModeState;
