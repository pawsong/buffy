import StateLayer from '@pasta/core/lib/StateLayer';

import {
  ToolType,
  GetGameState,
} from '../../interface';

import GameZoneView from '../GameZoneView';

import GameZoneViewTool from './GameZoneViewTool';
export { GameZoneViewTool }

import MoveTool from './MoveTool';
import EditTerrainTool from './EditTerrainTool';

export default function createTool(
  toolType: ToolType,
  stateLayer: StateLayer,
  view: GameZoneView,
  getState: GetGameState
): GameZoneViewTool {
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
