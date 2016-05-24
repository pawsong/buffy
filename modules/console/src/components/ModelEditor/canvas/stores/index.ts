import * as THREE from 'three';
import { Ndarray } from 'ndarray';

import { createGeometryFromMesh } from '../../../../canvas/utils';
import { SimpleStore } from '../../../../libs';

import {
  Position,
  FileState,
} from '../../types';

interface Mesh {
  geometry: THREE.Geometry;
}

class Stores {
  meshStore: SimpleStore<THREE.Geometry>;

  constructor(state: FileState) {
    // Mesh store
    this.meshStore = new SimpleStore<THREE.Geometry>(null);
    this.voxelStateChange(state);
  }

  voxelStateChange(state: FileState) {
    const { mesh } = state.present.data;

    const geometry = this.meshStore.getState();
    const nextGeometry = createGeometryFromMesh(mesh);
    this.meshStore.update(nextGeometry);

    // Prevent memory leak
    if (geometry) geometry.dispose();
  }

  destroy() {
    const geometry = this.meshStore.getState();
    if (geometry) geometry.dispose();
  }
}

export default Stores;
