import THREE from 'three';
const invariant = require('fbjs/lib/invariant');

import { ToolState } from '../../../../../libs/Tool';
import Cursor, { CursorEventParams } from '../../../../../canvas/Cursor';
import Canvas from '../../../../../canvas/Canvas';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../canvas/Constants';

import {
  Position,
  ToolType,
} from '../../../types';

interface CursorStateOptions {
  getInteractables: () => THREE.Mesh[];
  getSize: () => Position;
  cursorOnFace: boolean;
  getOffset?: (intersect: THREE.Intersection) => THREE.Vector3;
  cursorVisible?: boolean;
  cursorMesh?: THREE.Mesh;
  cursorGeometry?: THREE.Geometry;
  cursorMaterial?: THREE.Material;
  transitionRequiresHit?: boolean;
  onCursorShow?: (visible: boolean) => any;
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
    getOffset,
    getSize,
    cursorOnFace,
    cursorVisible,
    cursorMesh,
    cursorGeometry,
    cursorMaterial,
    transitionRequiresHit,
    onCursorShow,
  }: CursorStateOptions) {
    super();

    const finalCursorVisible = cursorVisible !== false;

    if (finalCursorVisible) {
      invariant(cursorMesh || (cursorGeometry && cursorMaterial),
        'cursorMesh or cursorGeometry + cursorMaterial required'
      );
    }

    this.nextState = this.getNextStateName();
    this.transitionRequiresHit = transitionRequiresHit !== false;

    const position = new THREE.Vector3();
    const offset = new THREE.Vector3();

    this.cursor = new Cursor(canvas, {
      visible: finalCursorVisible,
      mesh: cursorMesh,
      geometry: cursorGeometry,
      material: cursorMaterial,
      cursorOnFace,
      getInteractables,
      getOffset,
      onCursorShow,
      hitTest: (intersect, meshPosition) => {
        Cursor.getDataPosition(meshPosition, position);
        const size = getSize();
        return (
             position.x >= 0 && position.x < size[0]
          && position.y >= 0 && position.y < size[1]
          && position.z >= 0 && position.z < size[2]
        );
      },
      onMouseDown: params => this.handleMouseDown(params),
      onMouseUp: params => this.onMouseUp(params),
    });
  }

  abstract onMouseDown(e: MouseEvent, intersect: THREE.Intersection, position: THREE.Vector3);
  onMouseUp(params: CursorEventParams) {}

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
