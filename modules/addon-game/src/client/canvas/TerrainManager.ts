import * as THREE from 'three';
import Terrain from '@pasta/core/lib/classes/Terrain';
import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../Constants';

class TerrainManager {
  scene: THREE.Scene;
  terrains: THREE.Mesh[];
  terrainsIndexed: { [index: string]: THREE.Mesh };

  geometry: THREE.Geometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.terrains = [];
    this.terrainsIndexed = {};

    this.geometry = new THREE.PlaneGeometry(BOX_SIZE, BOX_SIZE);
    this.geometry.rotateX( - Math.PI / 2 );
    this.geometry.translate( PIXEL_UNIT, 0, PIXEL_UNIT );
  }

  findAndUpdate(x: number, z: number, color: number) {
    const key = `${x}_${z}`;
    if (this.terrainsIndexed[key]) {
      this.terrainsIndexed[key].material['color'].setHex(color);
    } else {
      const material = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.FrontSide,
      });
      const terrainMesh = new THREE.Mesh(this.geometry, material);
      terrainMesh.position.x = (x - 1) * BOX_SIZE;
      terrainMesh.position.z = (z - 1) * BOX_SIZE;
      this.scene.add(terrainMesh);

      this.terrains.push(terrainMesh);
      this.terrainsIndexed[key] = terrainMesh;
    }
  }

  destroy() {
    this.geometry.dispose();
    this.terrainsIndexed = {};
    this.terrains.forEach(terrain => terrain.material.dispose());
  }
}

export default TerrainManager;
