import * as THREE from 'three';
import { Position } from '@pasta/core/lib/types';
import TerrainManager from '../../../canvas/Canvas/TerrainManager';
import {
  BOX_SIZE,
  PIXEL_UNIT,
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../canvas/Constants';

import WorldEditorCanvas from './WorldEditorCanvas';

const yUnit = new THREE.Vector3(0, 1, 0);

class CursorManager {
  cursorMesh: THREE.Mesh;
  material: THREE.Material;
  offset: THREE.Vector3;

  private canvas: WorldEditorCanvas;
  private raycaster: THREE.Raycaster;
  private boundOnMouseEevent: (e: MouseEvent) => any;

  constructor(canvas: WorldEditorCanvas) {
    this.offset = new THREE.Vector3();

    this.canvas = canvas;

    this.raycaster = new THREE.Raycaster();

    this.material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    this.boundOnMouseEevent = this.onMouseMove.bind(this);
  }

  onMouseMove(event: MouseEvent) {
    event.preventDefault();

    this.cursorMesh.visible = false;

    this.raycaster.setFromCamera({
      x: (event.offsetX / this.canvas.container.offsetWidth) * 2 - 1,
      y: -(event.offsetY / this.canvas.container.offsetHeight) * 2 + 1,
    }, this.canvas.camera);

    const intersects = this.raycaster.intersectObjects([this.canvas.chunk.mesh]);

    if (intersects.length === 0) return;

    const intersect = intersects[0];
    if (yUnit.dot(intersect.face.normal) === 0) return;

    this.cursorMesh.visible = true;

    this.cursorMesh.position.copy(intersect.point).add(intersect.face.normal);
    this.cursorMesh.position
      .divideScalar(PIXEL_SCALE)
      .floor()
      .multiplyScalar(PIXEL_SCALE)
      .add(this.offset);
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

  setColor(color: number) {
    this.cursorMesh.material['color'].setHex(color);
  }

  start(geometry: THREE.Geometry, offset: Position) {
    this.cursorMesh = new THREE.Mesh(geometry, this.material);
    this.offset.set(offset[0], offset[1], offset[2]);

    this.cursorMesh.material['color'].setHex(0xff0000);
    this.canvas.scene.add(this.cursorMesh);
    this.canvas.container.addEventListener('mousemove', this.boundOnMouseEevent, false);
  }

  stop() {
    this.canvas.scene.remove(this.cursorMesh);
    this.canvas.container.removeEventListener('mousemove', this.boundOnMouseEevent, false);
  }

  destroy() {
    this.stop();
    this.cursorMesh.geometry.dispose();
    this.cursorMesh.material.dispose();
  }
}

export default CursorManager;
