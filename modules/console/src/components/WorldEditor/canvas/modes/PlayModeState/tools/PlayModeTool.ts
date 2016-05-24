import StateLayer from '@pasta/core/lib/StateLayer';

import {
  PlayToolType,
} from '../../../../types';

import ModeTool, { ToolState, ModeToolUpdateParams } from '../../ModeTool';
export { ToolState, ModeToolUpdateParams }

import WorldEditorCanvas from '../../../WorldEditorCanvas';

export interface InitParams {
  view: WorldEditorCanvas;
  stateLayer: StateLayer;
}

abstract class PlayModeTool<T> extends ModeTool<PlayToolType, InitParams, T> {}

export default PlayModeTool;
