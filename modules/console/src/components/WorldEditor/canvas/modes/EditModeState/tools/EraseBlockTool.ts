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
  ToolState, ToolStates,
  ModeToolUpdateParams,
} from './EditModeTool';

import {
  removeZoneBlock,
} from '../../../../actions';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

interface WaitStateProps {}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: EraseBlockTool) {
    super();

    const offset = new THREE.Vector3();

    this.cursor = new Cursor(tool.canvas, {
      geometry: this.tool.cursorGeometry,
      material: this.tool.cursorMaterial,
      getInteractables: () => [tool.canvas.chunk.mesh],
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

  onInit(params: InitParams) {
    super.onInit(params);

    this.cursorGeometry = new THREE.CubeGeometry(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.cursorMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });
  }

  createStates(): ToolStates {
    return {
      wait: new WaitState(this),
    };
  }

  destroy() {
  }
}

export default EraseBlockTool;
