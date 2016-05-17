import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';

import { Position } from '@pasta/core/lib/types';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../../canvas/Constants';
import Cursor from '../../../../../../canvas/Cursor';

import {
  Color,
  WorldEditorState,
  EditToolType,
  GetState,
  Action,
  SubscribeAction,
  UnsubscribeAction,
} from '../../../../types';

import {
  CHANGE_PALETTE_COLOR, ChangePaletteColorAction,
} from '../../../../actions';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import EditModeTool, {
  InitParams,
  ToolState,
} from './EditModeTool';

export function rgbToHex({ r, g, b }) {
  return (1 << 24) | (r << 16) | (g << 8) | b;
}

class WaitState extends ToolState {
  cursor: Cursor;
  cursorMaterial: THREE.MeshBasicMaterial;
  unsubscribeAction: UnsubscribeAction;

  constructor(
    private canvas: WorldEditorCanvas,
    private getState: GetState,
    private subscribeAction: SubscribeAction
  ) {
    super();

    this.cursorMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    this.cursor = new Cursor(canvas, {
      geometry: this.canvas.cubeGeometry,
      material: this.cursorMaterial,
      getInteractables: () => [this.canvas.chunk.mesh],
      offset: [PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF],
      onMouseUp: () => this.handleMouseUp(),
    });
  }

  setCursorColor({ r, g, b }: Color) {
    this.cursorMaterial.color.setRGB(r / 0xff, g / 0xff, b / 0xff);
  }

  onEnter() {
    this.unsubscribeAction = this.subscribeAction(this.handleActionDispatch);

    const { editMode: { paletteColor } } = this.getState();
    this.setCursorColor(paletteColor);

    this.cursor.start();
  }

  handleActionDispatch = (action: Action<any>) => {
    switch (action.type) {
      case CHANGE_PALETTE_COLOR: {
        const { color } = <ChangePaletteColorAction>action;
        this.setCursorColor(color);
      }
    }
  }

  handleMouseUp() {
    const position = this.cursor.getPosition();
    if (!position) { return; }

    const { editMode: { paletteColor } } = this.getState();

    // TODO: Refactoring
    // This is bad... this is possible because view directly accesses data memory space.
    // But we have to explicitly get memory address from data variable.
    this.canvas.chunk.findAndUpdate([
      position.x,
      position.y,
      position.z,
    ], paletteColor);
    this.canvas.chunk.update();
  }

  onLeave() {
    this.unsubscribeAction();
    this.unsubscribeAction = null;

    this.cursor.stop();
  }
}

class AddBlockTool extends EditModeTool{
  getToolType() { return EditToolType.ADD_BLOCK; }

  init({ view, getState, subscribeAction }: InitParams) {
    const wait = new WaitState(view, getState, subscribeAction);

    return {
      wait,
    };
  }

  destroy() {}
}

export default AddBlockTool;
