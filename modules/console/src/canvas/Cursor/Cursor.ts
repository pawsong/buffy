import * as THREE from 'three';
import { Position } from '@pasta/core/lib/types';

const invariant = require('fbjs/lib/invariant');

import Canvas from '../Canvas';
import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../Constants';

export interface CursorEventParams {
  event: MouseEvent;
  intersect: THREE.Intersection;
}

interface CursorOptions {
  cursorOnFace?: boolean;

  visible?: boolean;
  intersectRecursively?: boolean;
  mesh?: THREE.Mesh;
  geometry?: THREE.Geometry;
  material?: THREE.Material;
  offset?: Position;
  scale?: number;
  renderOnUpdate?: boolean;

  getInteractables?: () => THREE.Object3D[];
  determineIntersect?: (intersects: THREE.Intersection[]) => THREE.Intersection;
  getOffset?: (intersect: THREE.Intersection) => THREE.Vector3;
  hitTest?: (intersect: THREE.Intersection, meshPosition: THREE.Vector3) => boolean;

  onHit?: (params: CursorEventParams) => any;
  onMiss?: (params: CursorEventParams) => any;
  onTouchTap?: (params: CursorEventParams) => any;
  onMouseDown?: (params: CursorEventParams) => any;
  onMouseUp?: (params: CursorEventParams) => any;
  onCursorShow?: (visible: boolean) => any;
}

class Cursor {
  static getDataPosition(meshPosition: THREE.Vector3, out: THREE.Vector3) {
    return out.copy(meshPosition).divideScalar(PIXEL_SCALE).floor();
  }

  private static getCursorPositionOnFace(intersect: THREE.Intersection, out: THREE.Vector3) {
    out.copy(intersect.point);
    if (intersect.face) out.add(intersect.face.normal);
  }

  private static getCursorPositionUnderFace(intersect: THREE.Intersection, out: THREE.Vector3) {
    out.copy(intersect.point).sub(intersect.face.normal);
    if (intersect.face) out.sub(intersect.face.normal);
 }

  private canvasPosition: THREE.Vector3;

  private mesh: THREE.Mesh;
  private hitTest: (intersect: THREE.Intersection, meshPosition: THREE.Vector3) => boolean;

  private canvas: Canvas;
  private raycaster: THREE.Raycaster;
  private intersectRecursively: boolean;

  private getIntractables: () => THREE.Object3D[];
  private determineIntersect: (intersects: THREE.Intersection[]) => THREE.Intersection;
  private getCursorOffset: (intersect: THREE.Intersection) => THREE.Vector3;
  private onHit: (params: CursorEventParams) => any;
  private onMiss: (params: CursorEventParams) => any;
  private onMouseDown: (params: CursorEventParams) => any;
  private onMouseUp: (params: CursorEventParams) => any;
  private onTouchTap: (params: CursorEventParams) => any;
  private onCursorShow: (visible: boolean) => any;

  private position: THREE.Vector3;
  private visible: boolean;
  private externalMesh: boolean;

  private getCursorPostionFromIntersect: (intersect: THREE.Intersection, out: THREE.Vector3) => any;
  private render: () => any;

  private missHaveToRenderer: boolean;

  constructor(canvas: Canvas, {
    cursorOnFace,
    visible,
    intersectRecursively,
    mesh,
    geometry,
    material,
    offset,
    scale,
    getOffset,
    getInteractables,
    determineIntersect,
    onHit,
    onMiss,
    onTouchTap,
    onMouseDown,
    onMouseUp,
    onCursorShow,
    hitTest,
    renderOnUpdate,
  }: CursorOptions) {
    this.canvasPosition = new THREE.Vector3();
    this.position = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();

    this.canvas = canvas;

    this.visible = visible !== false;

    this.intersectRecursively = intersectRecursively || false;

    this.externalMesh = !!mesh;

    if (this.externalMesh) {
      this.mesh = mesh;
    } else if (this.visible) {
      invariant(geometry && material, 'visible cursor requires geoemtry & material');

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.visible = false;
    } else {
      this.mesh = new THREE.Mesh();
    }

    if (scale) {
      this.mesh.scale.set(scale, scale, scale);
    }

    if (offset) {
      const _offset = new THREE.Vector3(offset[0], offset[1], offset[2]);
      this.getCursorOffset = () => _offset;
    } else if (getOffset) {
      this.getCursorOffset = getOffset;
    } else {
      const offset = new THREE.Vector3();
      this.getCursorOffset = () => offset;
    }

    this.getIntractables = getInteractables || (() => []);
    this.determineIntersect = determineIntersect || (intersects => intersects[0]);
    this.onHit = onHit || (() => {});
    this.onMiss = onMiss || (() => {});
    this.hitTest = hitTest || (() => true);
    this.onCursorShow = onCursorShow || (visible => this.mesh.visible = visible);

    this.onMouseDown = onMouseDown || null;
    this.onMouseUp = onMouseUp || null;
    this.onTouchTap = onTouchTap || null;

    this.render = renderOnUpdate !== false ? () => this.canvas.render() : () => {};

    if (cursorOnFace !== false) {
      this.getCursorPostionFromIntersect = Cursor.getCursorPositionOnFace;
    } else {
      this.getCursorPostionFromIntersect = Cursor.getCursorPositionUnderFace;
    }
  }

  start(event?: MouseEvent) {
    if (!this.externalMesh && this.visible) this.canvas.scene.add(this.mesh);

    this.canvas.container.addEventListener('mousemove', this._onMouseMove, false);

    if (this.onMouseDown) {
      this.canvas.container.addEventListener('mousedown', this._onMouseDown, false);
    }

    if (this.onMouseUp || this.onTouchTap) {
      this.canvas.container.addEventListener('mouseup', this._onMouseUp, false);
    }

    this.onCursorShow(false);
    this.missHaveToRenderer = true;

    if (event) this._onMouseMove(event);
  }

  stop() {
    if (!this.externalMesh && this.visible) this.canvas.scene.remove(this.mesh);

    this.canvas.container.removeEventListener('mousemove', this._onMouseMove, false);

    if (this.onMouseDown) {
      this.canvas.container.removeEventListener('mousedown', this._onMouseDown, false);
    }

    if (this.onMouseUp || this.onTouchTap) {
      this.canvas.container.removeEventListener('mouseup', this._onMouseUp, false);
    }
  }

  changeGeometry(geometry: THREE.Geometry) {
    invariant(!this.externalMesh, 'Cannot change external mesh geometry');

    // Create new mesh that inherits properties from current mesh.
    const newMesh = new THREE.Mesh(geometry, this.mesh.material);
    newMesh.visible = this.mesh.visible;
    newMesh.position.copy(this.mesh.position);

    // Swap mesh
    this.canvas.scene.remove(this.mesh);
    this.canvas.scene.add(newMesh);

    this.mesh = newMesh;
  }

  private getIntersect(event: MouseEvent) {
    this.raycaster.setFromCamera({
      x: (event.offsetX / this.canvas.container.clientWidth) * 2 - 1,
      y: -(event.offsetY / this.canvas.container.clientHeight) * 2 + 1,
    }, this.canvas.camera);

    const intersects = this.raycaster.intersectObjects(this.getIntractables(), this.intersectRecursively);
    return this.determineIntersect(intersects);
  }

  getPositionFromMouseEvent(event: MouseEvent, out: THREE.Vector3) {
    const intersect = this.getCanvasPositionFromMouseEvent(event, out);
    if (!intersect) return intersect;

    out.divideScalar(PIXEL_SCALE).floor();
    return intersect;
  }

  private getCanvasPositionFromMouseEvent(event: MouseEvent, out: THREE.Vector3) {
    const intersect = this.getIntersect(event);
    if (!intersect) return null;

    this.getCursorPostionFromIntersect(intersect, this.canvasPosition);

    this.canvasPosition.divideScalar(PIXEL_SCALE).floor()
      .multiplyScalar(PIXEL_SCALE)
      .add(this.getCursorOffset(intersect));

    if (!this.hitTest(intersect, this.canvasPosition)) return null;

    out.copy(this.canvasPosition);
    return intersect;
  }

  private handleMouseMove(event: MouseEvent): boolean {
    const intersect = this.getCanvasPositionFromMouseEvent(event, this.mesh.position);
    if (intersect) {
      if (!this.mesh.visible) this.onCursorShow(true);
      this.onHit({ event, intersect });
      return true;
    } else {
      if (this.mesh.visible) this.onCursorShow(false);
      this.onMiss({ event, intersect });
      return false;
    }
  }

  private _onMouseMove = (event: MouseEvent) => {
    event.preventDefault();
    if (this.handleMouseMove(event)) {
      this.missHaveToRenderer = true;
      this.render();
    } else {
      if (this.missHaveToRenderer) {
        this.missHaveToRenderer = false;
        this.render();
      }
    }
  }

  private _onMouseDown = (event: MouseEvent) => {
    event.preventDefault();

    if (event.which !== 1) return;

    const intersect = this.getIntersect(event);

    // TODO: Touch device support.
    this.onMouseDown({ event, intersect });

    this.render();
  }

  private _onMouseUp = (event: MouseEvent) => {
    event.preventDefault();

    if (event.which !== 1) return;

    const intersect = this.getIntersect(event);

    // TODO: Touch device support.
    if (this.onTouchTap) this.onTouchTap({ event, intersect });

    if (this.onMouseUp) this.onMouseUp({ event, intersect });

    this.render();
  }

  getPosition() {
    if (!this.mesh.visible) return null;
    return Cursor.getDataPosition(this.mesh.position, this.position);
  }

  destroy() {
    this.stop();
  }
}

export default Cursor;
