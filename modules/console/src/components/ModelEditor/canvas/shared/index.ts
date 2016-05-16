import * as THREE from 'three';
import { Ndarray } from 'ndarray';

import {
  Position,
  VoxelState,
} from '../../types';

import { createGeometryFromMesh } from '../../../../canvas/utils';

import { SimpleStore } from '../../../../libs';

interface Mesh {
  geometry: THREE.Geometry;
}

interface CanvasSharedOptions {
  getState: () => VoxelState;
}

interface VoxelStateListener {
  (state: VoxelState): any;
}

class CanvasShared {
  cameraPositionStore: SimpleStore<Position>;
  meshStore: SimpleStore<Mesh>;

  constructor({ getState }: CanvasSharedOptions) {
    this.cameraPositionStore = new SimpleStore<Position>([0, 0, 0]);

    // Mesh store
    this.meshStore = new SimpleStore<Mesh>({
      geometry: null,
    });

    this.voxelStateChange(getState());
  }

  voxelStateChange(state: VoxelState) {
    const mesh = state.present.mesh;

    const { geometry } = this.meshStore.getState();
    const nextGeometry = createGeometryFromMesh(mesh);
    this.meshStore.update({ geometry: nextGeometry });

    // Prevent memory leak
    if (geometry) geometry.dispose();
  }
}

export default CanvasShared;
