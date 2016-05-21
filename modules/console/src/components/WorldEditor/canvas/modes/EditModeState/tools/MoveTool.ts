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

import EditModeTool, {
  InitParams,
  ToolState,
} from './EditModeTool';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

export function rgbToHex({ r, g, b }) {
  return (1 << 24) | (r << 16) | (g << 8) | b;
}

interface WaitStateProps {}

class WaitState extends ToolState {
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
}

class MoveTool extends EditModeTool<any> {
  getToolType() { return EditToolType.MOVE; }

  init({ view }: InitParams) {
    const wait = new WaitState(view);

    return {
      wait,
    };
  }

  destroy() {}
}

export default MoveTool;
