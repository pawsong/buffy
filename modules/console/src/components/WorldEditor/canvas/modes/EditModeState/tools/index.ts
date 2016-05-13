import StateLayer from '@pasta/core/lib/StateLayer';

import {
  EditToolType,
  GetState,
} from '../../../../types';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import EditModeTool, { InitParams } from './EditModeTool';
export { EditModeTool, InitParams }

import MoveTool from './MoveTool';
import EditTerrainTool from './EditTerrainTool';

export default function createTool(
  toolType: EditToolType,
  getState: GetState,
  params: InitParams
): EditModeTool {
  switch(toolType) {
    case EditToolType.move: {
      return new MoveTool(params, getState);
    }
    case EditToolType.editTerrain: {
      return new EditTerrainTool(params, getState);
    }
  }

  throw new Error(`Invalid tool type: ${EditToolType[toolType]}`);
}
