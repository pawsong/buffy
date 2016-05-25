import * as THREE from 'three';
import { Ndarray } from 'ndarray';
import mesher from '../meshers/greedy';
import { createGeometryFromMesh } from '../utils';
// const compileMesher = require('greedy-mesher');

import { Position, Color } from '@pasta/core/lib/types';

import {
  PIXEL_SCALE,
} from '../Constants';

function rgbToHex({ r, g, b }) {
  return (1 << 24) /* Used by mesher */ | (r << 16) | (g << 8) | b;
}

/**
 * Chunk is a unit that has fixed size and contains multiple blocks,
 * which works as a piece of the whole world.
 */
class Chunk {
  mesh: THREE.Mesh;

  private scene: THREE.Scene;
  private material: THREE.Material;
  private data: Ndarray;
  private geometry: THREE.Geometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
    });
  }

  setData(data: Ndarray) {
    this.data = data;
  }

  remove(pos: Position) {
    // TODO: Make order right.
    this.data.set(pos[2], pos[1], pos[0], 0);
  }

  findAndUpdate(pos: Position, color: Color) {
    // TODO: Make order right.
    this.data.set(pos[2], pos[1], pos[0], rgbToHex(color));
  }

  update() {
    if (this.mesh) this.scene.remove(this.mesh);
    if (this.geometry) this.geometry.dispose();

    const mesh = mesher(this.data.data, this.data.shape);
    this.geometry = createGeometryFromMesh(mesh);

    // Create surface mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    // surfacemesh.doubleSided = false;
    this.mesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.scene.add(this.mesh);

    return this.geometry;
  }

  dispose() {
    // TODO: Implement
  }
}

export default Chunk;
