import * as THREE from 'three';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';

import {
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  ToolType,
} from '../../types';

import {
  voxelAddBatch,
} from '../../actions';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../canvas/Constants';

import AddBlockTool, { AddBlockToolWaitState } from './AddBlockTool';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAW = 'draw';

class BrushTool extends AddBlockTool {
  getToolType() { return ToolType.BRUSH; }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAW]: new DrawState(this),
    };
  }
}

class WaitState extends AddBlockToolWaitState<THREE.Vector3> {
  getNextStateName() { return STATE_DRAW; }
  getNextStateParams(e: MouseEvent, intersect: THREE.Intersection, position: THREE.Vector3) {
    return position;
  }
}

class DrawState extends ToolState {
  private cursor: Cursor;
  private anchor: THREE.Vector3;
  private target: THREE.Vector3;

  private drawGuideX: THREE.Mesh;
  private drawGuideY: THREE.Mesh;
  private drawGuideZ: THREE.Mesh;

  constructor(private tool: BrushTool) {
    super();

    // Setup draw guides

    const drawGuideMaterial = new THREE.MeshBasicMaterial({ visible: false });

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.translate(1 / 2, 1 / 2, 1 / 2);

    this.drawGuideX = new THREE.Mesh(geometry, drawGuideMaterial);
    this.drawGuideY = new THREE.Mesh(geometry, drawGuideMaterial);
    this.drawGuideZ = new THREE.Mesh(geometry, drawGuideMaterial);

    // Setup cursor

    const offset = new THREE.Vector3();

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      getInteractables: () => [
        this.drawGuideX,
        this.drawGuideY,
        this.drawGuideZ,
      ],
      getOffset: intersect => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * intersect.face.normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * intersect.face.normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * intersect.face.normal.z)
      ),
      onMouseUp: params => this.handleMouseUp(params),
      onHit: params => this.handleHit(params),
    });

    this.anchor = new THREE.Vector3();
    this.target = new THREE.Vector3();
  }

  onEnter(cursorPosition: THREE.Vector3) {
    // Init data

    this.anchor.copy(cursorPosition);
    this.target.copy(this.anchor);

    // Show and move draw guides
    const { x, y, z } = cursorPosition.multiplyScalar(PIXEL_SCALE);

    const { size } = this.tool.props;

    this.drawGuideX.position.set(0, y, z);
    this.drawGuideX.scale.set(size[0] * PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);

    this.drawGuideY.position.set(x, 0, z);
    this.drawGuideY.scale.set(PIXEL_SCALE, size[1] * PIXEL_SCALE, PIXEL_SCALE);

    this.drawGuideZ.position.set(x, y, 0);
    this.drawGuideZ.scale.set(PIXEL_SCALE, PIXEL_SCALE, size[2] * PIXEL_SCALE);

    this.drawGuideX.updateMatrixWorld(false);
    this.drawGuideY.updateMatrixWorld(false);
    this.drawGuideZ.updateMatrixWorld(false);

    // Init cursor mesh

    this.tool.selectionBox.show(true);
    this.tool.selectionBox.mesh.position.set(x, y, z);
    this.tool.selectionBox.resize(1, 1, 1);

    this.cursor.start();
  }

  handleMouseUp({ } : CursorEventParams) {
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

  onLeave() {
    this.cursor.stop();
    this.tool.selectionBox.show(false);
  }
}

export default BrushTool;
