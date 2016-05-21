import * as THREE from 'three';
import { Differ, Schema } from '@pasta/helper/lib/diff';
import ModelEditorCanvas from '../ModelEditorCanvas';

import {
  ToolType,
  ModelEditorState,
  DispatchAction,
  GetEditorState,
} from '../../types';

import Tool, { ToolState } from '../../../../libs/Tool';
export { ToolState }

export interface InitParams {
  canvas: ModelEditorCanvas;
  getState: GetEditorState;
  dispatchAction: DispatchAction;
}

abstract class ModelEditorTool<T> extends Tool<ToolType, InitParams, ModelEditorState, T> {
}

export default ModelEditorTool;
