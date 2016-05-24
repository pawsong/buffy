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
  Action,
  DispatchAction,
} from '../../../../types';

import {
  CHANGE_PALETTE_COLOR, ChangePaletteColorAction,
  addZoneBlock,
} from '../../../../actions';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import EditModeTool, {
  InitParams,
  ToolState,
  ModeToolUpdateParams,
} from './EditModeTool';

export function rgbToHex({ r, g, b }) {
  return (1 << 24) | (r << 16) | (g << 8) | b;
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(
    private tool: AddBlockTool,
    private canvas: WorldEditorCanvas
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
    this.cursor.start();
  }

  handleMouseUp() {
    const position = this.cursor.getPosition();
    if (!position) { return; }

    this.tool.dispatchAction(addZoneBlock(
      this.tool.props.activeZoneId,
      position.x, position.y, position.z,
      this.tool.props.color
    ));
  }

  onLeave() {
    this.cursor.stop();
  }
}

interface AddBlockToolProps {
  color: Color;
  activeZoneId: string;
}

class AddBlockTool extends EditModeTool<AddBlockToolProps> {
  cursorMaterial: THREE.MeshBasicMaterial;
  dispatchAction: DispatchAction;

  getToolType() { return EditToolType.ADD_BLOCK; }

  setCursorColor(color: Color) {
    this.cursorMaterial.color.setRGB(color.r / 0xff, color.g / 0xff, color.b / 0xff);
  }

  getPropsSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        color: { type: SchemaType.ANY },
        activeZoneId: { type: SchemaType.ANY },
      }
    };
  }

  mapProps({ editor }: ModeToolUpdateParams) {
    return {
      color: editor.editMode.paletteColor,
      activeZoneId: editor.editMode.activeZoneId,
    };
  }

  render(diff: AddBlockToolProps) {
    this.setCursorColor(diff.color || this.props.color);
  }

  init({ view, dispatchAction }: InitParams) {
    this.dispatchAction = dispatchAction;

    this.cursorMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    const wait = new WaitState(this, view);

    return {
      wait,
    };
  }

  destroy() {}
}

export default AddBlockTool;
