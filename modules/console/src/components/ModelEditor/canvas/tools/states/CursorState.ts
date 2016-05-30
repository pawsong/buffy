import * as THREE from 'three';
const invariant = require('fbjs/lib/invariant');

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

interface CursorStateOptions {
  getInteractables: () => THREE.Mesh[];
  cursorOnFace: boolean;
  cursorMesh?: THREE.Mesh;
  cursorGeometry?: THREE.Geometry;
  cursorMaterial?: THREE.Material;
  transitionRequiresHit?: boolean;
}

abstract class CursorState<T> extends ToolState {
  cursor: Cursor;

  private nextState: string;
  private transitionRequiresHit: boolean;

  getNextStateName(): string { return ''; }
  getNextStateParams(e: MouseEvent, intersect: THREE.Intersection, position: THREE.Vector3): T {
    return null;
  };

  constructor(canvas: Canvas, {
    getInteractables,
    cursorOnFace,
    cursorMesh,
    cursorGeometry,
    cursorMaterial,
    transitionRequiresHit,
  }: CursorStateOptions) {
    super();

    invariant(cursorMesh || (cursorGeometry && cursorMaterial),
      'cursorMesh or cursorGeometry + cursorMaterial required'
    );

    this.nextState = this.getNextStateName();
    this.transitionRequiresHit = transitionRequiresHit !== false;

    const position = new THREE.Vector3();
    const offset = new THREE.Vector3();

    this.cursor = new Cursor(canvas, {
      mesh: cursorMesh,
      geometry: cursorGeometry,
      material: cursorMaterial,
      cursorOnFace,
      getInteractables,
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

  abstract onMouseDown(e: MouseEvent, intersect: THREE.Intersection, position: THREE.Vector3);

  private handleMouseDown(params: CursorEventParams) {
    const position = this.cursor.getPosition();

    this.onMouseDown(params.event, params.intersect, position);

    if (this.nextState && (!this.transitionRequiresHit || position)) {
      this.transitionTo(this.nextState, this.getNextStateParams(params.event, params.intersect, position));
    }
  }

  onEnter() {
    this.cursor.start();
  }

  onLeave() {
    this.cursor.stop();
  }
}

export default CursorState;
