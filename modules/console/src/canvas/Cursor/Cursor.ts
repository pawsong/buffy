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
  visible?: boolean;
  mesh?: THREE.Mesh;
  geometry?: THREE.Geometry;
  material?: THREE.Material;
  offset?: Position;
  scale?: number;
  renderOnUpdate?: boolean;

  getInteractables?: () => THREE.Object3D[];
  getOffset?: (normal: THREE.Vector3) => THREE.Vector3;
  hitTest?: (intersect: THREE.Intersection) => boolean;

  onInteract?: (params: CursorEventParams) => any;
  onMiss?: (params: CursorEventParams) => any;
  onTouchTap?: (params: CursorEventParams) => any;
  onMouseDown?: (params: CursorEventParams) => any;
  onMouseUp?: (params: CursorEventParams) => any;
  onCursorShow?: (visible: boolean) => any;
}

class Cursor {
  private mesh: THREE.Mesh;
  private hitTest: (intersect: THREE.Intersection) => boolean;

  private canvas: Canvas;
  private raycaster: THREE.Raycaster;

  private getIntractables: () => THREE.Object3D[];
  private getCursorOffset: (normal: THREE.Vector3) => THREE.Vector3;
  private onInteract: (params: CursorEventParams) => any;
  private onMiss: (params: CursorEventParams) => any;
  private onMouseDown: (params: CursorEventParams) => any;
  private onMouseUp: (params: CursorEventParams) => any;
  private onTouchTap: (params: CursorEventParams) => any;
  private onCursorShow: (visible: boolean) => any;

  private position: THREE.Vector3;
  private visible: boolean;
  private externalMesh: boolean;

  private render: () => any;

  constructor(canvas: Canvas, options: CursorOptions) {
    this.position = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();

    this.canvas = canvas;

    const {
      visible,
      mesh,
      geometry,
      material,
      offset,
      scale,
      getOffset,
      getInteractables,
      onInteract,
      onMiss,
      onTouchTap,
      onMouseDown,
      onMouseUp,
      onCursorShow,
      hitTest,
      renderOnUpdate,
    } = options;

    this.visible = visible !== false;

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
    this.onInteract = onInteract || (() => {});
    this.onMiss = onMiss || (() => {});
    this.hitTest = hitTest || (() => true);
    this.onCursorShow = onCursorShow || (visible => this.mesh.visible = visible);

    this.onMouseDown = onMouseDown || null;
    this.onMouseUp = onMouseUp || null;
    this.onTouchTap = onTouchTap || null;

    this.render = renderOnUpdate !== false ? () => this.canvas.render() : () => {};
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
      x: (event.offsetX / this.canvas.container.offsetWidth) * 2 - 1,
      y: -(event.offsetY / this.canvas.container.offsetHeight) * 2 + 1,
    }, this.canvas.camera);

    const intersects = this.raycaster.intersectObjects(this.getIntractables());
    return intersects[0];
  }

  private handleMouseMove(event: MouseEvent) {
    const intersect = this.getIntersect(event);

    if (!intersect || !this.hitTest(intersect)) {
      if (this.mesh.visible) this.onCursorShow(false);
      this.onMiss({ event, intersect });
      return;
    }

    if (!this.mesh.visible) this.onCursorShow(true);

    this.mesh.position
      .copy(intersect.point).add(intersect.face.normal)
      .divideScalar(PIXEL_SCALE).floor().multiplyScalar(PIXEL_SCALE)
      .add(this.getCursorOffset(intersect.face.normal));

    this.onInteract({ event, intersect });
  }

  private _onMouseMove = (event: MouseEvent) => {
    event.preventDefault();
    this.handleMouseMove(event);

    this.render();
  }

  private _onMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    const intersect = this.getIntersect(event);

    // TODO: Touch device support.
    this.onMouseDown({ event, intersect });

    this.render();
  }

  private _onMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    const intersect = this.getIntersect(event);

    // TODO: Touch device support.
    if (this.onTouchTap) this.onTouchTap({ event, intersect });

    if (this.onMouseUp) this.onMouseUp({ event, intersect });

    this.render();
  }

  getPosition() {
    if (!this.mesh.visible) return null;

    return this.position.copy(this.mesh.position)
      .divideScalar(PIXEL_SCALE).floor();
  }

  destroy() {
    this.stop();
  }
}

export default Cursor;
