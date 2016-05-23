import * as THREE from 'three';
import { Ndarray } from 'ndarray';

import { createGeometryFromMesh } from '../../../../canvas/utils';
import { SimpleStore } from '../../../../libs';

import {
  Position,
  VoxelState,
} from '../../types';

interface Mesh {
  geometry: THREE.Geometry;
}

class Stores {
  cameraPositionStore: SimpleStore<Position>;
  meshStore: SimpleStore<THREE.Geometry>;

  constructor(state: VoxelState) {
    this.cameraPositionStore = new SimpleStore<Position>([0, 0, 0]);

    // Mesh store
    this.meshStore = new SimpleStore<THREE.Geometry>(null);

    this.voxelStateChange(state);
  }

  voxelStateChange(state: VoxelState) {
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
