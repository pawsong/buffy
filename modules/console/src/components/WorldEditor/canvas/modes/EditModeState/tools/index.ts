import StateLayer from '@pasta/core/lib/StateLayer';

import {
  EditToolType,
  GetState,
} from '../../../../types';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import EditModeTool, { InitParams } from './EditModeTool';
export { EditModeTool, InitParams }

import MoveTool from './MoveTool';
import AddBlockTool from './AddBlockTool';
import EraseBlockTool from './EraseBlockTool';
import ColorizeTool from './ColorizeTool';
import AddRobotTool from './AddRobotTool';

export default function createTool(
  toolType: EditToolType,
  getState: GetState,
  params: InitParams
): EditModeTool {
  switch(toolType) {
    case EditToolType.MOVE: {
      return new MoveTool(params, getState);
    }
    case EditToolType.ADD_BLOCK: {
      return new AddBlockTool(params, getState);
    }
    case EditToolType.COLORIZE: {
      return new ColorizeTool(params, getState);
    }
    case EditToolType.REMOVE_BLOCK: {
      return new EraseBlockTool(params, getState);
    }
    case EditToolType.ADD_ROBOT: {
      return new AddRobotTool(params, getState);
    }
  }

  throw new Error(`Invalid tool type: ${EditToolType[toolType]}`);
}