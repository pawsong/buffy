import * as THREE from 'three';
import { Position } from '@pasta/core/lib/types';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';

import {
  EditToolType,
  WorldEditorState,
  DispatchAction,
} from '../../../../types';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../../canvas/Constants';
import Cursor, { CursorEventParams } from '../../../../../../canvas/Cursor';

import EditModeTool, {
  InitParams,
  ToolState,
  ModeToolUpdateParams,
} from './EditModeTool';

import {
  removeZoneBlock,
} from '../../../../actions';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

interface WaitStateProps {}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(
    private tool: EraseBlockTool,
    private canvas: WorldEditorCanvas
  ) {
    super();

    const offset = new THREE.Vector3();

    this.cursor = new Cursor(canvas, {
      geometry: this.tool.cursorGeometry,
      material: this.tool.cursorMaterial,
      getInteractables: () => [this.canvas.chunk.mesh],
      getOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      onTouchTap: (params) => this.handleTouchTap(params),
    });
  }

  onEnter() {
    this.cursor.start();
  }

  onLeave() {
    this.cursor.stop();
  }

  handleTouchTap({ event, intersect }: CursorEventParams) {
    const position = this.cursor.getPosition();
    if (!position) return;

    this.tool.dispatchAction(removeZoneBlock(
      this.tool.props.activeZoneId,
      position.x, position.y, position.z
    ));
  }
}

interface EraseBlockToolProps {
  activeZoneId: string;
}

class EraseBlockTool extends EditModeTool<EraseBlockToolProps, void, void> {
  dispatchAction: DispatchAction;

  cursorGeometry: THREE.Geometry;
  cursorMaterial: THREE.Material;

  getToolType() { return EditToolType.REMOVE_BLOCK; }

  mapParamsToProps(params: ModeToolUpdateParams) {
    return {
      activeZoneId: params.editor.editMode.activeZoneId,
    };
  }

  init({ view, dispatchAction }: InitParams) {
    this.dispatchAction = dispatchAction;

    this.cursorGeometry = new THREE.CubeGeometry(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.cursorMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
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

  destroy() {
  }
}

export default EraseBlockTool;
