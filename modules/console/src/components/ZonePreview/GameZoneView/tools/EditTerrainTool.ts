import StateLayer from '@pasta/core/lib/StateLayer';

import {
  Color,
  GameState,
  ToolType,
} from '../../interface';

import GameZoneViewTool, { GameZoneViewToolState, GameZoneViewToolStates, InitParams } from './GameZoneViewTool';
import GameZoneView from '../GameZoneView';

export function rgbToHex({ r, g, b }) {
  return (1 << 24) | (r << 16) | (g << 8) | b;
}

interface WaitStateProps {
  playerId: string;
  brushColor: Color;
}

class WaitState extends GameZoneViewToolState<WaitStateProps> {
  constructor(
    private view: GameZoneView,
    private stateLayer: StateLayer
  ) {
    super();
  }

  mapStateToProps(gameState: GameState): WaitStateProps {
    return {
      playerId: gameState.playerId,
      brushColor: gameState.brushColor,
    };
  }

  onEnter() {
    this.view.cursorManager.start();
  }

  onLeave() {
    this.view.cursorManager.stop();
  }

  onMouseDown() {
    const { hit, position } = this.view.cursorManager.getPosition();
    if (!hit) { return; }

    this.stateLayer.rpc.updateTerrain({
      objectId: this.props.playerId,
      x: position.x,
      z: position.z,
      color: rgbToHex(this.props.brushColor),
    });
  }

  render() {
    this.view.cursorManager.setColor(rgbToHex(this.props.brushColor));
  }
}

class EditTerrainTool extends GameZoneViewTool {
  getToolType() { return ToolType.editTerrain; }

  init({ view, stateLayer }: InitParams) {
    const wait = new WaitState(view, stateLayer);

    return <GameZoneViewToolStates>{
      wait,
    };
  }

  destroy() {}
}

export default EditTerrainTool;
