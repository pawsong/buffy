import * as THREE from 'three';
import { Ndarray } from 'ndarray';
import mesher from '../meshers/greedy';
// const compileMesher = require('greedy-mesher');

import { Position, Color } from '@pasta/core/lib/types';

import {
  BOX_SIZE,
  MINI_PIXEL_SIZE,
  PIXEL_NUM,
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

  findAndUpdate(pos: Position, color: Color) {
    this.data.set(pos[0] - 1, pos[1] - 1, pos[2] - 1, rgbToHex(color));
  }

  update() {
    const { vertices, faces } = mesher(this.data.data, this.data.shape);

    const geometry = new THREE.Geometry();

    geometry.vertices.length = 0;
    geometry.faces.length = 0;

    for(var i = 0; i < vertices.length; ++i) {
      const q = vertices[i];
      geometry.vertices.push(new THREE.Vector3(q[0], q[1], q[2]));
    }

    for(var i = 0; i < faces.length; ++i) {
      const q = faces[i];
      const f = new THREE.Face3(q[0], q[1], q[2]);
      f.color = new THREE.Color(q[3]);
      f.vertexColors = [f.color,f.color,f.color];
      geometry.faces.push(f);
    }

    geometry.computeFaceNormals();

    geometry.verticesNeedUpdate = true;
    geometry.elementsNeedUpdate = true;
    geometry.normalsNeedUpdate = true;

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    // Create surface mesh
    const surfacemesh = new THREE.Mesh(geometry, this.material);
    // surfacemesh.doubleSided = false;
    surfacemesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    surfacemesh.receiveShadow = true;


    if (this.mesh) this.scene.remove(this.mesh);

    this.mesh = surfacemesh;
    this.scene.add(this.mesh);

    return geometry;
  }
}

export default Chunk;
