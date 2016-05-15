import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';

import { Position } from '@pasta/core/lib/types';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../../canvas/Constants';

import {
  Color,
  WorldEditorState,
  EditToolType,
} from '../../../../types';

import WorldEditorCanvasTool, {
  WorldEditorCanvsToolState,
  WorldEditorCanvsToolStates,
} from '../../WorldEditorCanvasTool';
import WorldEditorCanvas from '../../../WorldEditorCanvas';

import EditModeTool, { InitParams } from './EditModeTool';

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
    private canvas: WorldEditorCanvas
  ) {
    super();

    this.cursorOffset = [PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF];
  }

  mapStateToProps(gameState: WorldEditorState): WaitStateProps {
    return {
      playerId: gameState.editMode.playerId,
      brushColor: gameState.editMode.paletteColor,
    };
  }

  onEnter() {
    this.canvas.cursorManager.start({
      cursorGeometry: this.canvas.cubeGeometry,
      cursorOffset: this.cursorOffset,
    });
  }

  onLeave() {
    this.canvas.cursorManager.stop();
  }

  onMouseDown() {
    const { hit, position } = this.canvas.cursorManager.getPosition();
    if (!hit) { return; }

    // TODO: Refactoring
    // This is bad... this is possible because view directly accesses data memory space.
    // But we have to explicitly get memory address from data variable.
    this.canvas.chunk.findAndUpdate([
      position.x,
      position.y,
      position.z,
    ], this.props.brushColor);
    this.canvas.chunk.update();
  }

  render() {
    this.canvas.cursorManager.setColor(rgbToHex(this.props.brushColor));
  }
}

class AddBlockTool extends EditModeTool{
  getToolType() { return EditToolType.ADD_BLOCK; }

  init({ view }: InitParams) {
    const wait = new WaitState(view);

    return <WorldEditorCanvsToolStates>{
      wait,
    };
  }

  destroy() {}
}

export default AddBlockTool;
