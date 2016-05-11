import * as THREE from 'three';
import TerrainManager from '../../../canvas/Canvas/TerrainManager';
import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../Constants';

import WorldEditorCanvas from './WorldEditorCanvas';

class CursorManager {
  canvas: WorldEditorCanvas;

  cursorMesh: THREE.Mesh;
  onMouseMove: EventListener;

  constructor(canvas: WorldEditorCanvas) {
    this.canvas = canvas;

    const raycaster = new THREE.Raycaster();

    const cursorGeometry = new THREE.PlaneBufferGeometry( BOX_SIZE, BOX_SIZE );
    cursorGeometry.rotateX(- Math.PI / 2);

    const cursorMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    this.cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);

    this.onMouseMove = event => {
      event.preventDefault();

      raycaster.setFromCamera({
        x: (event['offsetX'] / canvas.container.offsetWidth) * 2 - 1,
        y: -(event['offsetY'] / canvas.container.offsetHeight) * 2 + 1,
      }, canvas.camera);

      const intersects = raycaster.intersectObjects(canvas.terrainManager.terrains);
      if (intersects.length === 0) {
        this.cursorMesh.visible = false;
        return;
      }

      this.cursorMesh.visible = true;

      const intersect = intersects[0];

      this.cursorMesh.position.copy(intersect.point).add(intersect.face.normal);
      this.cursorMesh.position
        .divideScalar(BOX_SIZE)
        .floor()
        .multiplyScalar(BOX_SIZE)
        .addScalar(PIXEL_UNIT);

      this.cursorMesh.position.y = 0;
    }

    this.cursorMesh.visible = false;
  }

  getPosition() {
    const position = new THREE.Vector3().copy(this.cursorMesh.position)
      .divideScalar(BOX_SIZE)
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

  start() {
    this.cursorMesh.material['color'].setHex(0xff0000);
    this.canvas.scene.add(this.cursorMesh);
    this.canvas.container.addEventListener('mousemove', this.onMouseMove, false);
  }

  stop() {
    this.canvas.scene.remove(this.cursorMesh);
    this.canvas.container.removeEventListener('mousemove', this.onMouseMove, false);
  }

  destroy() {
    this.stop();
    this.cursorMesh.geometry.dispose();
    this.cursorMesh.material.dispose();
  }
}

export default CursorManager;
