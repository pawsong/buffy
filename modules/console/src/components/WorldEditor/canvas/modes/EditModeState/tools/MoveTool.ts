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

interface WaitStateProps {}

class WaitState extends WorldEditorCanvsToolState<WaitStateProps> {
  cursorOffset: Position;

  constructor(
    private canvas: WorldEditorCanvas
  ) {
    super();

    this.cursorOffset = [PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF];
  }

  onEnter() {
  }

  onLeave() {
  }

  onMouseDown() {
    // const { hit, position } = this.canvas.cursorManager.getPosition();
    // if (!hit) { return; }
    // console.log(position);
  }

  render() {}
}

class MoveTool extends EditModeTool{
  getToolType() { return EditToolType.MOVE; }

  init({ view }: InitParams) {
    const wait = new WaitState(view);

    return <WorldEditorCanvsToolStates>{
      wait,
    };
  }

  destroy() {}
}

export default MoveTool;
