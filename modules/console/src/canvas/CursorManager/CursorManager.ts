import * as THREE from 'three';
import { Position } from '@pasta/core/lib/types';
import Canvas from '../Canvas';
import {
  BOX_SIZE,
  PIXEL_UNIT,
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../Constants';

export interface CursorEventParams {
  event: MouseEvent;
  intersect: THREE.Intersection;
}

interface StartOptions {
  getInteractables?: () => THREE.Object3D[];
  onInteract?: (params: CursorEventParams) => any;
  onTouchTap?: (params: CursorEventParams) => any;
  onMouseDown?: (params: CursorEventParams) => any;
  onMouseUp?: (params: CursorEventParams) => any;
  cursorGeometry?: THREE.Geometry;
  cursorMaterial?: THREE.Material;
  cursorOffset?: Position;
  cursorScale?: number;
  getCursorOffset?: (normal: THREE.Vector3) => THREE.Vector3;
  hitTest?: (intersect: THREE.Intersection) => boolean;
}

class CursorManager {
  cursorMesh: THREE.Mesh;
  material: THREE.Material;
  offset: THREE.Vector3;
  hitTest: (intersect: THREE.Intersection) => boolean;

  private canvas: Canvas;
  private raycaster: THREE.Raycaster;

  private getIntractables: () => THREE.Object3D[];
  private onInteract: (params: CursorEventParams) => any;
  private onMouseDown: (params: CursorEventParams) => any;
  private onMouseUp: (params: CursorEventParams) => any;
  private onTouchTap: (params: CursorEventParams) => any;
  private getCursorOffset: (normal: THREE.Vector3) => THREE.Vector3;

  private position: THREE.Vector3;

  constructor(canvas: Canvas) {
    this.offset = new THREE.Vector3();
    this.position = new THREE.Vector3();

    this.canvas = canvas;

    this.raycaster = new THREE.Raycaster();

    this.material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });
  }

  start({
    getInteractables,
    onInteract,
    onTouchTap,
    onMouseDown,
    onMouseUp,
    cursorGeometry,
    cursorMaterial,
    cursorOffset,
    cursorScale,
    getCursorOffset,
    hitTest,
  } : StartOptions) {
    this.getIntractables = getInteractables || (() => []);
    this.onInteract = onInteract || (({ intersect }) => this.handleInteract(intersect));
    this.onTouchTap = onTouchTap || (() => {});
    this.hitTest = hitTest || (() => true);

    if (cursorGeometry) {
      this.cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial || this.material);
      this.cursorMesh.visible = false;
      this.canvas.scene.add(this.cursorMesh);
    } else {
      this.cursorMesh = new THREE.Mesh();
    }

    if (cursorScale) {
      this.cursorMesh.scale.set(cursorScale, cursorScale, cursorScale);
    }

    if (cursorOffset) {
      const offset = new THREE.Vector3(cursorOffset[0], cursorOffset[1], cursorOffset[2]);
      this.getCursorOffset = () => offset;
    } else if (getCursorOffset) {
      this.getCursorOffset = getCursorOffset;
    } else {
      const offset = new THREE.Vector3();
      this.getCursorOffset = () => offset;
    }

    if (onMouseDown) {
      this.onMouseDown = onMouseDown;
      this.canvas.container.addEventListener('mousedown', this._onMouseDown, false);
    }

    this.onMouseUp = onMouseUp;

    this.canvas.container.addEventListener('mousemove', this._onMouseMove, false);
    this.canvas.container.addEventListener('mouseup', this._onMouseUp, false);
  }

  changeConfig({
    onMouseDown,
    onMouseUp,
    getInteractables,
  } : StartOptions) {
    if (onMouseDown) {
      if (!this.onMouseDown) {
        this.canvas.container.addEventListener('mousedown', this._onMouseDown, false);
      }
      this.onMouseDown = onMouseDown;
    }

    if (onMouseUp) {
      this.onMouseUp = onMouseUp;
    }

    if (getInteractables) this.getIntractables = getInteractables;
  }

  stop() {
    this.getIntractables = null;
    this.onInteract = null;
    this.onTouchTap = null;
    this.getCursorOffset = null;

    this.onMouseDown = null;
    this.onMouseUp = null;

    this.canvas.scene.remove(this.cursorMesh);
    this.cursorMesh = null;

    this.canvas.container.removeEventListener('mousedown', this._onMouseDown, false);
    this.canvas.container.removeEventListener('mousemove', this._onMouseMove, false);
    this.canvas.container.removeEventListener('mouseup', this._onMouseUp, false);
  }

  changeGeometry(geometry: THREE.Geometry) {
    // Create new mesh that inherits properties from current mesh.
    const newMesh = new THREE.Mesh(geometry, this.cursorMesh.material);
    newMesh.visible = this.cursorMesh.visible;
    newMesh.position.copy(this.cursorMesh.position);

    // Swap mesh
    this.canvas.scene.remove(this.cursorMesh);
    this.canvas.scene.add(newMesh);
    this.cursorMesh = newMesh;
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
    this.cursorMesh.visible = false;
    const intersect = this.getIntersect(event);
    this.onInteract({ event, intersect });
  }

  private _onMouseMove = (event: MouseEvent) => {
    event.preventDefault();
    this.handleMouseMove(event);
  }

  private _onMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    const intersect = this.getIntersect(event);

    // TODO: Touch device support.
    this.onMouseDown({ event, intersect });
  }

  private _onMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    const intersect = this.getIntersect(event);

    // TODO: Touch device support.
    this.onTouchTap({ event, intersect });

    if (this.onMouseUp) this.onMouseUp({ event, intersect });

    // Test interact again.
    this.handleMouseMove(event);
  }

  handleInteract(intersect: THREE.Intersection) {
    if (!intersect) return;
    if (!this.hitTest(intersect)) return;

    this.cursorMesh.visible = true;

    this.cursorMesh.position.copy(intersect.point).add(intersect.face.normal);
    this.cursorMesh.position
      .divideScalar(PIXEL_SCALE)
      .floor()
      .multiplyScalar(PIXEL_SCALE)
      .add(this.getCursorOffset(intersect.face.normal));
  }

  getPosition() {
    const position = new THREE.Vector3().copy(this.cursorMesh.position)
      .divideScalar(PIXEL_SCALE)
      .floor()
      .addScalar(1);

    return {
      hit: this.cursorMesh.visible,
      position,
    }
  }

  getPosition2() {
    if (!this.cursorMesh.visible) return null;

    return this.position.copy(this.cursorMesh.position)
      .divideScalar(PIXEL_SCALE)
      .floor()
      .addScalar(1);
  }

  setColor(color: number) {
    this.material['color'].setHex(color);
  }

  destroy() {
    this.stop();
    this.material.dispose();
  }
}

export default CursorManager;
