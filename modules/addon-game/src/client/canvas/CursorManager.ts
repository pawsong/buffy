import * as THREE from 'three';
import TerrainManager from './TerrainManager';
import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../Constants';

class CursorManager {
  container: HTMLElement;
  scene: THREE.Scene;
  cursorMesh: THREE.Mesh;
  onMouseMove: EventListener;

  constructor(container: HTMLElement, scene: THREE.Scene, raycaster: THREE.Raycaster,
              camera: THREE.Camera, terrainManager: TerrainManager) {
    this.container = container;
    this.scene = scene;

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
        x: (event['offsetX'] / container.offsetWidth) * 2 - 1,
        y: -(event['offsetY'] / container.offsetHeight) * 2 + 1,
      }, camera);

      const intersects = raycaster.intersectObjects(terrainManager.terrains);
      if (intersects.length === 0) { return; }

      const intersect = intersects[0];

      this.cursorMesh.position.copy(intersect.point).add(intersect.face.normal);
      this.cursorMesh.position
        .divideScalar(BOX_SIZE)
        .floor()
        .multiplyScalar(BOX_SIZE)
        .addScalar(PIXEL_UNIT);

      this.cursorMesh.position.y = 0;
    }
  }

  getPosition() {
    const position = new THREE.Vector3().copy(this.cursorMesh.position)
      .divideScalar(BOX_SIZE)
      .floor()
      .addScalar(1);

    return {
      hit: true,
      position,
    }
  }

  start() {
    this.scene.add(this.cursorMesh);
    this.container.addEventListener('mousemove', this.onMouseMove, false);
  }

  stop() {
    this.scene.remove(this.cursorMesh);
    this.container.removeEventListener('mousemove', this.onMouseMove, false);
  }

  destroy() {
    this.stop();
    this.cursorMesh.geometry.dispose();
    this.cursorMesh.material.dispose();
  }
}

export default CursorManager;
