import StateLayer from '@pasta/core/lib/StateLayer';

import {
  PlayToolType,
  GetState,
  WorldEditorState,
} from '../../../../types';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import Tool, { ToolState } from '../../../../../../libs/Tool';
export { ToolState }

export interface InitParams {
  view: WorldEditorCanvas;
  stateLayer: StateLayer;
  getState: GetState;
}

abstract class PlayModeTool<T> extends Tool<PlayToolType, InitParams, WorldEditorState, T> {}

export default PlayModeTool;
