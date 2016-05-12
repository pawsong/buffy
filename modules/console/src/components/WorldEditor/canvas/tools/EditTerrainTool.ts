import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';

import { Position } from '@pasta/core/lib/types';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../canvas/Constants';

import {
  Color,
  WorldEditorState,
  ToolType,
} from '../../types';

import WorldEditorCanvasTool, {
  WorldEditorCanvsToolState,
  WorldEditorCanvsToolStates,
  InitParams,
} from './WorldEditorCanvasTool';
import WorldEditorCanvas from '../WorldEditorCanvas';

export function rgbToHex({ r, g, b }) {
  return (1 << 24) | (r << 16) | (g << 8) | b;
}

interface WaitStateProps {
  playerId: string;
  brushColor: Color;
}

class WaitState extends WorldEditorCanvsToolState<WaitStateProps> {
  cursorOffset: Position;

  constructor(
    private view: WorldEditorCanvas,
    private stateLayer: StateLayer
  ) {
    super();

    this.cursorOffset = [PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF];
  }

  mapStateToProps(gameState: WorldEditorState): WaitStateProps {
    return {
      playerId: gameState.playerId,
      brushColor: gameState.brushColor,
    };
  }

  onEnter() {
    this.view.cursorManager.start(this.view.cubeGeometry, this.cursorOffset);
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

class EditTerrainTool extends WorldEditorCanvasTool {
  getToolType() { return ToolType.editTerrain; }

  init({ view, stateLayer }: InitParams) {
    const wait = new WaitState(view, stateLayer);

    return <WorldEditorCanvsToolStates>{
      wait,
    };
  }

  destroy() {}
}

export default EditTerrainTool;
