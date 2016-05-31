import * as THREE from 'three';
import { Differ, Schema } from '@pasta/helper/lib/diff';
import ModelEditorCanvas from '../ModelEditorCanvas';

import {
  ToolType,
  ModelEditorState,
  DispatchAction,
} from '../../types';

import Tool, { ToolState, ToolStates } from '../../../../libs/Tool';
export { ToolState, ToolStates }

import { Keyboard } from '../../../../keyboard';

export interface InitParams {
  canvas: ModelEditorCanvas;
  dispatchAction: DispatchAction;
  keyboard: Keyboard;
}

abstract class ModelEditorTool<P, S, T> extends Tool<ToolType, InitParams, P, S, T> {
  canvas: ModelEditorCanvas;
  dispatchAction: DispatchAction;
  keyboard: Keyboard;

  onInit(params: InitParams) {
    this.canvas = params.canvas;
    this.dispatchAction = params.dispatchAction;
    this.keyboard = params.keyboard;
  }

  mapParamsToProps(params: ModelEditorState): P { return null; }

  onCameraMove() {}

  onRender() {}

  onResize() {}
}

export default ModelEditorTool;
