import THREE from 'three';

import Cursor, { CursorEventParams } from '../../../../../canvas/Cursor';

import {
  ToolState, ToolStates,
} from '../ModelEditorTool';

import {
  ToolType,
  Axis,
  Volumn,
  Color,
} from '../../../types';

import {
  voxelAddBatch3d,
} from '../../../actions';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../canvas/Constants';

import AddBlockTool, {
  AddBlockToolProps,
  AddBlockToolWaitState,
} from '../AddBlockTool';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAW = 'draw';

interface LineToolParams {
  onDragEnter?: () => any;
}

abstract class LineTool<T extends AddBlockToolProps> extends AddBlockTool<T> {
  drawGuideX: THREE.Mesh;
  drawGuideY: THREE.Mesh;
  drawGuideZ: THREE.Mesh;

  getToolType() { return ToolType.LINE; }

  createStates(): ToolStates {
    const params = this.getParams();
    return {
      [STATE_WAIT]: new WaitState(this, params),
      [STATE_DRAW]: new DrawState(this),
    };
  }

  abstract onDragEnter();

  abstract getAction(volumn: Volumn, color: Color);
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

  constructor(private tool: LineTool<AddBlockToolProps>) {
    super();

    // Setup draw guides

    const drawGuideMaterial = new THREE.MeshBasicMaterial({ visible: false });

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.translate(1 / 2, 1 / 2, 1 / 2);

    tool.drawGuideX = new THREE.Mesh(geometry, drawGuideMaterial);
    tool.drawGuideY = new THREE.Mesh(geometry, drawGuideMaterial);
    tool.drawGuideZ = new THREE.Mesh(geometry, drawGuideMaterial);

    // Setup cursor

    const offset = new THREE.Vector3();

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      getInteractables: () => [
        tool.drawGuideX,
        tool.drawGuideY,
        tool.drawGuideZ,
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

    this.tool.drawGuideX.position.set(0, y, z);
    this.tool.drawGuideX.scale.set(size[0] * PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);

    this.tool.drawGuideY.position.set(x, 0, z);
    this.tool.drawGuideY.scale.set(PIXEL_SCALE, size[1] * PIXEL_SCALE, PIXEL_SCALE);

    this.tool.drawGuideZ.position.set(x, y, 0);
    this.tool.drawGuideZ.scale.set(PIXEL_SCALE, PIXEL_SCALE, size[2] * PIXEL_SCALE);

    this.tool.drawGuideX.updateMatrixWorld(false);
    this.tool.drawGuideY.updateMatrixWorld(false);
    this.tool.drawGuideZ.updateMatrixWorld(false);

    // Init cursor mesh

    this.tool.selectionBox.show(true);
    this.tool.selectionBox.mesh.position.set(x, y, z);
    this.tool.selectionBox.resize(1, 1, 1);

    this.cursor.start();

    this.tool.onDragEnter();
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

  handleMouseUp({ } : CursorEventParams) {
    this.tool.dispatchAction(this.tool.getAction([
      Math.min(this.anchor.x, this.target.x),
      Math.min(this.anchor.y, this.target.y),
      Math.min(this.anchor.z, this.target.z),
      Math.max(this.anchor.x, this.target.x),
      Math.max(this.anchor.y, this.target.y),
      Math.max(this.anchor.z, this.target.z),
    ], this.tool.props.color));

    this.transitionTo(STATE_WAIT);
  }

  onLeave() {
    this.cursor.stop();
    this.tool.selectionBox.show(false);
  }
}

export default LineTool;
