import * as THREE from 'three';
import * as Immutable from 'immutable';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';
import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
  DESIGN_IMG_SIZE,
} from '../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  Position,
  ToolType,
} from '../../types';

import {
  voxelRemoveBatch,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';

class EraseTool extends ModelEditorTool<void, void, void> {
  translucentMaterial: THREE.Material;

  getToolType(): ToolType { return ToolType.erase; }

  onInit(params) {
    super.onInit(params);

    this.translucentMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });
  }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAG]: new DragState(this),
    };
  }

  destroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: EraseTool) {
    super();

    const offset = new THREE.Vector3();
    const position = new THREE.Vector3();

    this.cursor = new Cursor(tool.canvas, {
      geometry: this.tool.canvas.cubeGeometry,
      material: this.tool.translucentMaterial,
      getOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      getInteractables: () => [
        this.tool.canvas.component.modelMesh,
        this.tool.canvas.component.fragmentMesh,
      ],
      hitTest: (intersect, meshPosition) => {
        Cursor.getDataPosition(meshPosition, position);
        return (
             position.x >= 0 && position.x < DESIGN_IMG_SIZE
          && position.y >= 0 && position.y < DESIGN_IMG_SIZE
          && position.z >= 0 && position.z < DESIGN_IMG_SIZE
        );
      },
      onMouseDown: params => this.handleMouseDown(params),
    });
  }

  onEnter(event?: MouseEvent) {
    this.cursor.start(event);
  }

  handleMouseDown({ event, intersect }: CursorEventParams) {
    this.transitionTo(STATE_DRAG, event);
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
    private tool: EraseTool
  ) {
    super();
    this.position = new THREE.Vector3();

    const offset = new THREE.Vector3();

    this.selectedGeometry = new THREE.BoxGeometry(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.selectedGeometry.translate(PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF);

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      getOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      getInteractables: () => [tool.canvas.component.modelMesh],
      onInteract: params => this.handleInteract(params),
      onMouseUp: params => this.handleMouseUp(params),
    });
  }

  onEnter(event: MouseEvent) {
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
    this.tool.canvas.scene.add(mesh);

    this.selectedVoxels[key] = {
      position: [position.x, position.y, position.z],
      mesh,
    };
  }

  handleMouseUp({ event }: CursorEventParams) {
    const positions = Object.keys(this.selectedVoxels)
      .map(key => this.selectedVoxels[key].position);

    if (positions.length > 0) this.tool.dispatchAction(voxelRemoveBatch(positions));

    this.transitionTo(STATE_WAIT, event);
  }

  onLeave() {
    this.cursor.stop();

    Object.keys(this.selectedVoxels).forEach(key => {
      const { mesh } = this.selectedVoxels[key];
      this.tool.canvas.scene.remove(mesh);
    });
    this.selectedVoxels = null;
  }
}

export default EraseTool;
