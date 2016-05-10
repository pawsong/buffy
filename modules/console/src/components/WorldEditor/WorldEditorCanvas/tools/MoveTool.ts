import StateLayer from '@pasta/core/lib/StateLayer';

import {
  ToolType,
  WorldEditorState,
} from '../../types';

import WorldEditorCanvasTool, {
  WorldEditorCanvsToolState,
  WorldEditorCanvsToolStates,
  InitParams,
} from './WorldEditorCanvasTool';
import WorldEditorCanvas from '../WorldEditorCanvas';

interface WaitStateProps {
  playerId: string,
}

class WaitState extends WorldEditorCanvsToolState<WaitStateProps> {
  constructor(
    private view: WorldEditorCanvas,
    private stateLayer: StateLayer
  ) {
    super();
  }

  mapStateToProps(gameState: WorldEditorState): WaitStateProps {
    return {
      playerId: gameState.playerId,
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

    this.stateLayer.rpc.move({
      id: this.props.playerId,
      x: position.x,
      z: position.z,
    });
  }

  render() {}
}

class MoveTool extends WorldEditorCanvasTool {
  getToolType() { return ToolType.move; }

  init({ view, stateLayer }: InitParams) {
    const wait = new WaitState(view, stateLayer);

    return <WorldEditorCanvsToolStates>{
      wait,
    };
  }

  destroy() {}
}

export default MoveTool;
