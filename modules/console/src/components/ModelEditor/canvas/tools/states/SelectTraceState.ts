import * as THREE from 'three';

import { ToolState } from '../../../../../libs/Tool';
import Cursor, { CursorEventParams } from '../../../../../canvas/Cursor';
import Canvas from '../../../../../canvas/Canvas';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
  DESIGN_IMG_SIZE,
} from '../../../../../canvas/Constants';

import {
  Position,
  ToolType,
} from '../../../types';

export type StateEnterParams = MouseEvent;

abstract class SelectTraceState extends ToolState {
  cursor: Cursor;

  selectedGeometry: THREE.Geometry;
  selectedVoxels: { [index: string]: { mesh: THREE.Mesh, position: Position } };

  private position: THREE.Vector3;

  constructor(
    private canvas: Canvas,
    private traceMaterial: THREE.Material,
    getInteractables: () => THREE.Mesh[]
  ) {
    super();
    this.position = new THREE.Vector3();

    const offset = new THREE.Vector3();

    this.selectedGeometry = new THREE.BoxGeometry(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.selectedGeometry.translate(PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF);

    this.cursor = new Cursor(canvas, {
      visible: false,
      getOffset: intersect => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * intersect.face.normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * intersect.face.normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * intersect.face.normal.z)
      ),
      getInteractables,
      onHit: params => this.handleHit(params),
      onMouseUp: params => this.handleMouseUp(params),
    });
  }

  onEnter(event: StateEnterParams) {
    this.selectedVoxels = {};
    this.cursor.start(event);
  }

  handleHit({ intersect }: CursorEventParams) {
    const position = this.cursor.getPosition();
    if (!position) return;

    const key = [position.x, position.y, position.z].join('|');
    if (this.selectedVoxels[key]) return;

    const mesh = new THREE.Mesh(this.selectedGeometry, this.traceMaterial);
    mesh.position.copy(position).multiplyScalar(PIXEL_SCALE);
    this.canvas.scene.add(mesh);

    this.selectedVoxels[key] = {
      position: [position.x, position.y, position.z],
      mesh,
    };
  }

  abstract onTraceSelect(trace: Position[]);

  handleMouseUp({ event }: CursorEventParams) {
    const positions = Object.keys(this.selectedVoxels)
      .map(key => this.selectedVoxels[key].position);

    if (positions.length > 0) this.onTraceSelect(positions);

    this.transitionTo(ToolState.STATE_WAIT, event);
  }

  onLeave() {
    this.cursor.stop();

    Object.keys(this.selectedVoxels).forEach(key => {
      const { mesh } = this.selectedVoxels[key];
      this.canvas.scene.remove(mesh);
    });
    this.selectedVoxels = null;
  }
}

export default SelectTraceState;
