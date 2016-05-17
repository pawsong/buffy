import * as THREE from 'three';
import * as Immutable from 'immutable';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';
import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState,
} from './ModelEditorTool';

import ModelEditorCanvas from '../ModelEditorCanvas';
import { SetState } from '../types';

import {
  Position,
  ToolType,
  DispatchAction,
} from '../../types';

import Voxel, { VoxelMesh } from '../Voxel';

import {
  voxelRemoveBatch,
} from '../../actions';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../../constants/Pixels';

import {
  toAbsPos,
  toScreenPos,
} from '../utils';

const cube = new THREE.CubeGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
const cubeMaterial = new THREE.MeshBasicMaterial({
  vertexColors: THREE.VertexColors,
  opacity: 0.5,
  transparent: true,
  polygonOffset: true,
  polygonOffsetFactor: -0.1,
});

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';
const STATE_ROTATE = 'rotate';

class RotateState extends ToolState {
  handleMouseUp = () => this.transitionTo(STATE_WAIT)
  onEnter() { document.addEventListener('mouseup', this.handleMouseUp, false); }
  onLeave() { document.removeEventListener('mouseup', this.handleMouseUp, false); }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(
    private tool: EraseTool,
    private canvas: ModelEditorCanvas
  ) {
    super();
    const offset = new THREE.Vector3();

    this.cursor = new Cursor(canvas, {
      getInteractables: () => [this.canvas.modelMesh],
      geometry: this.canvas.cubeGeometry,
      material: this.tool.translucentMaterial,
      getOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      onMouseDown: params => this.handleMouseDown(params),
    });
  }

  onEnter(event?: MouseEvent) {
    this.cursor.start(event);
  }

  handleMouseDown({ event, intersect }: CursorEventParams) {
    if (intersect) {
      this.transitionTo(STATE_DRAG, event);
    } else {
      this.transitionTo(STATE_ROTATE);
    }
  }

  onLeave() {
    this.cursor.stop();
  }
}

class DragState extends ToolState {
  cursor: Cursor;

  selectedGeometry: THREE.Geometry;
  selectedVoxels: { [index: string]: { mesh: THREE.Mesh, position: Position } };

  private position: THREE.Vector3;

  constructor(
    private tool: EraseTool,
    private canvas: ModelEditorCanvas,
    private dispatchAction: DispatchAction
  ) {
    super();
    this.position = new THREE.Vector3();

    const offset = new THREE.Vector3();

    this.selectedGeometry = new THREE.BoxGeometry(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.selectedGeometry.translate(PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF);

    this.cursor = new Cursor(canvas, {
      visible: false,
      getOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      getInteractables: () => [this.canvas.modelMesh],
      onInteract: params => this.handleInteract(params),
      onMouseUp: params => this.handleMouseUp(params),
    });
  }

  onEnter(event: MouseEvent) {
    this.canvas.controls.enableRotate = false;

    this.selectedVoxels = {};
    this.cursor.start(event);
  }

  handleInteract({ intersect }: CursorEventParams) {
    const position = this.cursor.getPosition();
    if (!position) return;

    const key = [position.x, position.y, position.z].join('|');
    if (this.selectedVoxels[key]) return;

    const mesh = new THREE.Mesh(this.selectedGeometry, this.tool.translucentMaterial);
    mesh.position.copy(position).multiplyScalar(PIXEL_SCALE);
    // mesh.overdraw = false;
    this.canvas.scene.add(mesh);

    this.selectedVoxels[key] = {
      position: [position.x, position.y, position.z],
      mesh,
    };
  }

  handleMouseUp({ event }: CursorEventParams) {
    const positions = Object.keys(this.selectedVoxels)
      .map(key => this.selectedVoxels[key].position);
    console.log(positions);
    this.dispatchAction(voxelRemoveBatch(positions));
    this.transitionTo(STATE_WAIT, event);
  }

  onLeave() {
    this.canvas.controls.enableRotate = true;

    this.cursor.stop();

    Object.keys(this.selectedVoxels).forEach(key => {
      const { mesh } = this.selectedVoxels[key];
      this.canvas.scene.remove(mesh);
    });
    this.selectedVoxels = null;
  }
}

class EraseTool extends ModelEditorTool {
  translucentMaterial: THREE.Material;

  getToolType(): ToolType { return ToolType.erase; }

  init(params: InitParams) {
    this.translucentMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    const wait = new WaitState(this, params.canvas);
    const rotate = new RotateState();
    const drag = new DragState(this, params.canvas, params.dispatchAction);

    return {
      [STATE_WAIT]: wait,
      [STATE_DRAG]: drag,
      [STATE_ROTATE]: rotate,
    };
  }

  destroy() {

  }
}

export default EraseTool;
