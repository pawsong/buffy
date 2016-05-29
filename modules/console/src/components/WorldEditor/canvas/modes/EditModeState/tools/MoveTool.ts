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
  ToolState, ToolStates,
} from './EditModeTool';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

export function rgbToHex({ r, g, b }) {
  return (1 << 24) | (r << 16) | (g << 8) | b;
}

interface WaitStateProps {}

class WaitState extends ToolState {
  cursorOffset: Position;

  constructor(private tool: MoveTool) {
    super();
    this.cursorOffset = [PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF];
  }

  onEnter() {
  }

  onLeave() {
  }

  onMouseDown() {
  }
}

class MoveTool extends EditModeTool<any, any, any> {
  getToolType() { return EditToolType.MOVE; }

  onInit(params: InitParams) {
    super.onInit(params);
  }

  createStates(): ToolStates {
    return {
      wait: new WaitState(this),
    };
  }

  onDestroy() {}
}

export default MoveTool;
