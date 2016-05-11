import StateLayer from '@pasta/core/lib/StateLayer';

import {
  ToolType,
  GetState,
} from '../../types';

import WorldEditorCanvas from '../WorldEditorCanvas';

import WorldEditorCanvasTool from './WorldEditorCanvasTool';
export { WorldEditorCanvasTool }

import MoveTool from './MoveTool';
import EditTerrainTool from './EditTerrainTool';

export default function createTool(
  toolType: ToolType,
  stateLayer: StateLayer,
  view: WorldEditorCanvas,
  getState: GetState
): WorldEditorCanvasTool {
  switch(toolType) {
    case ToolType.move: {
      return new MoveTool({ view, stateLayer }, getState);
    }
    case ToolType.editTerrain: {
      return new EditTerrainTool({ view, stateLayer }, getState);
    }
  }

  throw new Error(`Invalid tool type: ${ToolType[toolType]}`);
}
