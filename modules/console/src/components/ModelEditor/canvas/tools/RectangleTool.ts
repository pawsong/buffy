import * as THREE from 'three';

import { Schema, SchemaType } from '@pasta/helper/lib/diff';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';

import {
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  ToolType,
  ModelEditorState,
} from '../../types';

import {
  voxelAddBatch,
} from '../../actions';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
  DESIGN_IMG_SIZE,
} from '../../../../canvas/Constants';

import AddBlockTool, { AddBlockToolWaitState } from './AddBlockTool';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAW = 'draw';

class RectangleTool extends AddBlockTool {
  getToolType() { return ToolType.RECTANGLE; }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAW]: new DrawState(this),
    };
  }
}

interface DrawEnterParams {
  anchor: THREE.Vector3;
  normal: THREE.Vector3;
}

class WaitState extends AddBlockToolWaitState<DrawEnterParams> {
  getDrawStateName() { return STATE_DRAW; }

  getDrawStateParams(intersect: THREE.Intersection, position: THREE.Vector3) {
    return {
      anchor: position,
      normal: intersect.face.normal,
    };
  }
}

class DrawState extends ToolState {
  private cursor: Cursor;
  private anchor: THREE.Vector3;
  private target: THREE.Vector3;

  private drawGuide: THREE.Mesh;

  constructor(private tool: RectangleTool) {
    super();

    // Setup draw guides

    const drawGuideGeometry = new THREE.BoxGeometry(1, 1, 1);
    drawGuideGeometry.translate(1 / 2, 1 / 2, 1 / 2);

    const drawGuideMaterial = new THREE.MeshBasicMaterial({ visible: false });

    this.drawGuide = new THREE.Mesh(drawGuideGeometry, drawGuideMaterial);

    // Setup cursor

    const offset = new THREE.Vector3();
    const intersectables = [this.drawGuide];

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      getInteractables: () => intersectables,
      getOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      onMouseUp: params => this.handleMouseUp(params),
      onHit : params => this.handleHit(params),
    });

    this.anchor = new THREE.Vector3();
    this.target = new THREE.Vector3();
  }

  onEnter({ anchor, normal }: DrawEnterParams) {
    // Init data

    this.anchor.copy(anchor);
    this.target.copy(this.anchor);

    // Show and move draw guides

    const scaledAnchor = anchor.multiplyScalar(PIXEL_SCALE);
    const absNormal = normal.multiply(normal);

    this.drawGuide.position.copy(absNormal).multiply(scaledAnchor);
    this.drawGuide.scale
      .copy(absNormal).subScalar(1).multiplyScalar(-1)
      .multiplyScalar(DESIGN_IMG_SIZE - 1).addScalar(1)
      .multiplyScalar(PIXEL_SCALE);
    this.drawGuide.updateMatrixWorld(false);

    // Init cursor mesh

    this.tool.selectionBox.show(true);
    this.tool.selectionBox.mesh.position.copy(scaledAnchor);
    this.tool.selectionBox.resize(1, 1, 1);

    this.cursor.start();
  }

  onLeave() {
    this.cursor.stop();
    this.tool.selectionBox.show(false);
  }

  handleMouseUp({ } : CursorEventParams) {
    this.tool.props.color;

    this.tool.dispatchAction(voxelAddBatch([
      Math.min(this.anchor.x, this.target.x),
      Math.min(this.anchor.y, this.target.y),
      Math.min(this.anchor.z, this.target.z),
      Math.max(this.anchor.x, this.target.x),
      Math.max(this.anchor.y, this.target.y),
      Math.max(this.anchor.z, this.target.z),
    ], this.tool.props.color));

    this.transitionTo(STATE_WAIT);
  }

  handleHit({ } : CursorEventParams) {
    const position = this.cursor.getPosition();
    if (!position) return;

    if (this.target.equals(position)) return;
    this.target.copy(position);

    const displacement = position.sub(this.anchor);

    this.tool.selectionBox.mesh.position.set(
      this.anchor.x + Math.min(displacement.x, 0),
      this.anchor.y + Math.min(displacement.y, 0),
      this.anchor.z + Math.min(displacement.z, 0)
    ).multiplyScalar(PIXEL_SCALE);

    this.tool.selectionBox.resize(
      Math.abs(displacement.x) + 1,
      Math.abs(displacement.y) + 1,
      Math.abs(displacement.z) + 1
    );
  }
}

export default RectangleTool;
