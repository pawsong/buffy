import StateLayer from '@pasta/core/lib/StateLayer';

import {
  ToolType,
} from '../../interface';

import GameZoneViewTool, { GameZoneViewToolState, GameZoneViewToolStates, InitParams } from './GameZoneViewTool';
import GameZoneView from '../GameZoneView';

interface WaitStateProps {}

class WaitState extends GameZoneViewToolState<WaitStateProps> {
  constructor(
    private view: GameZoneView,
    private stateLayer: StateLayer
  ) {
    super();
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

    this.stateLayer.rpc.move({
      id: this.stateLayer.store.myId,
      x: position.x,
      z: position.z,
    });
  }

  render() {}
}

class MoveTool extends GameZoneViewTool {
  getToolType() { return ToolType.move; }

  init({ view, stateLayer }: InitParams) {
    const wait = new WaitState(view, stateLayer);

    return <GameZoneViewToolStates>{
      wait,
    };
  }

  destroy() {}
}

export default MoveTool;
