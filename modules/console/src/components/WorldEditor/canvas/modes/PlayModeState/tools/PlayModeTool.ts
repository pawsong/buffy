import StateLayer from '@pasta/core/lib/StateLayer';

import {
  PlayToolType,
} from '../../../../types';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import WorldEditorCanvasTool from '../../WorldEditorCanvasTool';

export interface InitParams {
  view: WorldEditorCanvas;
  stateLayer: StateLayer;
}

abstract class PlayModeTool extends WorldEditorCanvasTool<PlayToolType, InitParams> {}

export default PlayModeTool;
