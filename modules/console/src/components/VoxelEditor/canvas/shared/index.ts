import * as THREE from 'three';
import { Ndarray } from 'ndarray';

import {
  Position,
  VoxelState,
} from '../../interface';

import { createVoxelGeometry } from './mesh';

import {
  voxelMapToArray,
} from '../utils';

import mesher, { GridFace } from '../meshers/greedy';

import { SimpleStore } from '../../../../libs';

interface Mesh {
  geometry: THREE.Geometry;
  gridFaces: GridFace[];
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
      gridFaces: [],
    });

    this.voxelStateChange(getState());
  }

  voxelStateChange(state: VoxelState) {
    const { vertices, faces, gridFaces } = state.present.mesh;

    const { geometry } = this.meshStore.getState();
    const nextGeometry = createVoxelGeometry(vertices, faces);
    this.meshStore.update({ geometry: nextGeometry, gridFaces });

    // Prevent memory leak
    if (geometry) geometry.dispose();
  }
}

export default CanvasShared;
