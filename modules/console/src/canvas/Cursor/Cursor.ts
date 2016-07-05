import THREE from 'three';
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
  normal: THREE.Vector3;
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
  interactablesAreRotated?: boolean;

  getInteractables?: () => THREE.Object3D[];
  determineIntersect?: (intersects: THREE.Intersection[]) => THREE.Intersection;
  getOffset?: (intersect: THREE.Intersection, normal: THREE.Vector3) => THREE.Vector3;
  hitTest?: (intersect: THREE.Intersection, meshPosition: THREE.Vector3) => boolean;

  onHit?: (params: CursorEventParams) => any;
  onMiss?: (params: CursorEventParams) => any;
  onTouchTap?: (params: CursorEventParams) => any;
  onMouseDown?: (params: CursorEventParams) => any;
  onMouseUp?: (params: CursorEventParams) => any;
  onCursorShow?: (visible: boolean) => any;

  onStart?: () => any;
  onStop?: () => any;
}

class Cursor {
  static getDataPosition(meshPosition: THREE.Vector3, out: THREE.Vector3) {
    return out.copy(meshPosition).divideScalar(PIXEL_SCALE).floor();
  }

  private static getCursorPositionOnFace(intersect: THREE.Intersection, normal: THREE.Vector3, out: THREE.Vector3) {
    out.copy(intersect.point);
    if (normal) out.add(normal);
  }

  private static getCursorPositionUnderFace(intersect: THREE.Intersection, normal: THREE.Vector3, out: THREE.Vector3) {
    out.copy(intersect.point);
    if (normal) out.sub(normal);
 }

  private canvasPosition: THREE.Vector3;

  private mesh: THREE.Mesh;
  private hitTest: (intersect: THREE.Intersection, meshPosition: THREE.Vector3) => boolean;

  private canvas: Canvas;
  private raycaster: THREE.Raycaster;
  private intersectRecursively: boolean;

  private getIntractables: () => THREE.Object3D[];
  private determineIntersect: (intersects: THREE.Intersection[]) => THREE.Intersection;
  private getCursorOffset: (intersect: THREE.Intersection, normal: THREE.Vector3) => THREE.Vector3;
  private onHit: (params: CursorEventParams) => any;
  private onMiss: (params: CursorEventParams) => any;
  private onMouseDown: (params: CursorEventParams) => any;
  private onMouseUp: (params: CursorEventParams) => any;
  private onTouchTap: (params: CursorEventParams) => any;
  private onCursorShow: (visible: boolean) => any;

  private onStart: () => any;
  private onStop: () => any;

  private position: THREE.Vector3;
  private visible: boolean;
  private externalMesh: boolean;
  private interactablesAreRotated: boolean;

  private getCursorPostionFromIntersect: (intersect: THREE.Intersection, normal: THREE.Vector3, out: THREE.Vector3) => any;
  private render: () => any;

  private missHaveToRenderer: boolean;

  private matTemp1 = new THREE.Matrix3();
  private vecTemp1 = new THREE.Vector3();

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
    onStart,
    onStop,
    hitTest,
    renderOnUpdate,
    interactablesAreRotated,
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

    this.interactablesAreRotated = interactablesAreRotated === true;

    this.onStart = onStart || null;
    this.onStop = onStop || null;
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

    if (this.onStart) this.onStart();

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

    if (this.onStop) this.onStop();
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

  private calculateIntersectNormal(intersect: THREE.Intersection) {
    if (!this.interactablesAreRotated) return intersect.face.normal;

    this.matTemp1.getNormalMatrix(intersect.object.matrixWorld);
    this.vecTemp1.copy(intersect.face.normal).applyMatrix3(this.matTemp1).normalize().round();
    return this.vecTemp1;
  }

  private getCanvasPositionFromMouseEvent(event: MouseEvent, out: THREE.Vector3) {
    const intersect = this.getIntersect(event);
    if (!intersect) return null;

    const normal = intersect.face ? this.calculateIntersectNormal(intersect) : null;
    this.getCursorPostionFromIntersect(intersect, normal, this.canvasPosition);

    this.canvasPosition.divideScalar(PIXEL_SCALE).floor()
      .multiplyScalar(PIXEL_SCALE)
      .add(this.getCursorOffset(intersect, normal));

    if (!this.hitTest(intersect, this.canvasPosition)) return null;

    out.copy(this.canvasPosition);
    return { intersect, normal };
  }

  private handleMouseMove(event: MouseEvent) {
    const result = this.getCanvasPositionFromMouseEvent(event, this.mesh.position);
    if (result) {
      const { intersect, normal } = result;
      if (!this.mesh.visible) this.onCursorShow(true);
      this.onHit({ event, intersect, normal });
    } else {
      if (this.mesh.visible) this.onCursorShow(false);
      this.onMiss({ event, intersect: null, normal: null });
    }

    return result;
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

    const result = this.handleMouseMove(event);
    if (result) {
      const { intersect, normal } = result;

      this.onMouseDown && this.onMouseDown({ event, intersect, normal });
    } else {
      this.onMouseDown && this.onMouseDown({ event, intersect: null, normal: null });
    }

    this.render();
  }

  private _onMouseUp = (event: MouseEvent) => {
    event.preventDefault();

    if (event.which !== 1) return;

    const result = this.handleMouseMove(event);
    if (result) {
      const { intersect, normal } = result;

      this.onTouchTap && this.onTouchTap({ event, intersect, normal });
      this.onMouseUp && this.onMouseUp({ event, intersect, normal });
    } else {
      this.onTouchTap && this.onTouchTap({ event, intersect: null, normal: null });
      this.onMouseUp && this.onMouseUp({ event, intersect: null, normal: null });
    }

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
