import StateLayer from '@pasta/core/lib/StateLayer';

import {
  EditToolType,
  GetState,
} from '../../../../types';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import EditModeTool, { InitParams } from './EditModeTool';
export { EditModeTool, InitParams }

import AddBlockTool from './AddBlockTool';
import EraseBlockTool from './EraseBlockTool';
import ColorizeTool from './ColorizeTool';

export default function createTool(
  toolType: EditToolType,
  getState: GetState,
  params: InitParams
): EditModeTool {
  switch(toolType) {
    case EditToolType.addBlock: {
      return new AddBlockTool(params, getState);
    }
    case EditToolType.colorize: {
      return new ColorizeTool(params, getState);
    }
    case EditToolType.eraseBlock: {
      return new EraseBlockTool(params, getState);
    }
  }

  throw new Error(`Invalid tool type: ${EditToolType[toolType]}`);
}
