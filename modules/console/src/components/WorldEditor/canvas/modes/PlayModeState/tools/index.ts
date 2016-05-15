import StateLayer from '@pasta/core/lib/StateLayer';

import {
  PlayToolType,
  GetState,
} from '../../../../types';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import PlayModeTool, { InitParams } from './PlayModeTool';
export { PlayModeTool, InitParams }

import MoveTool from './MoveTool';

export default function createTool(
  toolType: PlayToolType,
  getState: GetState,
  params: InitParams
): PlayModeTool {
  switch(toolType) {
    case PlayToolType.MOVE: {
      return new MoveTool(params, getState);
    }
  }

  throw new Error(`Invalid tool type: ${PlayToolType[toolType]}`);
}
