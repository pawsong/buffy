import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';

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

  constructor(
    private tool: AddBlockTool,
    private canvas: WorldEditorCanvas,
    private getState: GetState
  ) {
    super();

    this.cursor = new Cursor(canvas, {
      geometry: this.canvas.cubeGeometry,
      material: this.tool.cursorMaterial,
      getInteractables: () => [this.canvas.chunk.mesh],
      offset: [PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF],
      onMouseUp: () => this.handleMouseUp(),
    });
  }

  onEnter() {
    const { editMode: { paletteColor } } = this.getState();
    this.cursor.start();
  }

  handleActionDispatch = (action: Action<any>) => {
    switch (action.type) {
      case CHANGE_PALETTE_COLOR: {
        const { color } = <ChangePaletteColorAction>action;
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
    this.cursor.stop();
  }
}

interface AddBlockToolProps {
  color: Color;
}

class AddBlockTool extends EditModeTool<AddBlockToolProps> {
  cursorMaterial: THREE.MeshBasicMaterial;

  getToolType() { return EditToolType.ADD_BLOCK; }

  setCursorColor(color: Color) {
    this.cursorMaterial.color.setRGB(color.r / 0xff, color.g / 0xff, color.b / 0xff);
  }

  getPropsSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        color: {
          type: SchemaType.ANY,
        },
      }
    };
  }

  mapProps(state: WorldEditorState) {
    return {
      color: state.editMode.paletteColor,
    };
  }

  render(diff: AddBlockToolProps) {
    this.setCursorColor(diff.color || this.props.color);
  }

  init({ view, getState }: InitParams) {
    this.cursorMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    const wait = new WaitState(this, view, getState);

    return {
      wait,
    };
  }

  destroy() {}
}

export default AddBlockTool;
