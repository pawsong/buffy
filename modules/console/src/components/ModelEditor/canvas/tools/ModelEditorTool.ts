import * as THREE from 'three';
import ModelEditorCanvas from '../ModelEditorCanvas';

import {
  ToolType,
  ModelEditorState,
  DispatchAction,
  SubscribeAction,
  GetEditorState,
} from '../../types';

import Tool, { ToolState } from '../../../../libs/Tool';
export { ToolState }

export interface InitParams {
  canvas: ModelEditorCanvas;
  getState: GetEditorState;
  dispatchAction: DispatchAction;
  subscribeAction: SubscribeAction;
}

abstract class ModelEditorTool extends Tool<ToolType, InitParams> {}

export default ModelEditorTool;
