import StateLayer from '@pasta/core/lib/StateLayer';

import {
  PlayToolType,
} from '../../../../types';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import PlayModeTool, { InitParams } from './PlayModeTool';
export { PlayModeTool, InitParams }

import MoveTool from './MoveTool';

export default function createTool(
  toolType: PlayToolType,
  params: InitParams
): PlayModeTool<any, any, any> {
  switch(toolType) {
    case PlayToolType.MOVE: {
      return new MoveTool(params);
    }
  }

  throw new Error(`Invalid tool type: ${PlayToolType[toolType]}`);
}
