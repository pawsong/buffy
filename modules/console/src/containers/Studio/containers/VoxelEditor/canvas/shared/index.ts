import { Store } from 'redux';
import { GridFace } from '../meshers/greedy';
import * as THREE from 'three';
import { SagaMiddleware } from 'redux-saga';
import { fork, take, select } from 'redux-saga/effects';
import { Ndarray } from 'ndarray';

import { watchVoxelChange, MeshStore } from './mesh';

import { State } from '../../../../../../reducers';

import {
  VOXEL_ADD_BATCH,
  VOXEL_REMOVE,
  VOXEL_REMOVE_BATCH,
  VOXEL_UNDO,
  VOXEL_UNDO_SEEK,
  VOXEL_REDO,
  VOXEL_REDO_SEEK,
  VOXEL_ROTATE,
  LOAD_WORKSPACE,
  UPDATE_WORKSPACE,
} from '../../../../../../actions/voxelEditor';

import { SimpleStore } from '../../../../libs';

interface Position {
  x: number;
  y: number;
  z: number;
}

interface Mesh {
  voxelData: Ndarray;
  geometry: THREE.Geometry;
  gridFaces: GridFace[];
}

export interface CanvasShared {
  cameraPositionStore: SimpleStore<Position>;
  meshStore: MeshStore;
}

interface Options {
  sagaMiddleware: SagaMiddleware;
  store: Store;
}

export default function({
  sagaMiddleware,
  store,
}: Options): CanvasShared {
  // Camera position store
  const cameraPositionStore = new SimpleStore<Position>({
    x: 0, y: 0, z: 0,
  });

  // Mesh store
  const meshStore = new SimpleStore<Mesh>({
    voxelData: null,
    geometry: null,
    gridFaces: [],
  });
  const meshStoreTask = sagaMiddleware.run(watchVoxelChange as any, meshStore);

  return {
    cameraPositionStore,
    meshStore,
  };
}



// observeStore(state => state.voxelOp, op => {
//   switch(op.type) {
//     case ActionTypes.ADD_VOXEL_BATCH:
//       {
//         op.voxels.forEach(voxel => {
//           const { position, color } = voxel;
//           voxelData.set(position.z - 1, position.y - 1, position.x - 1, rgbToHex(color));
//         });
//         updateVoxelGeometry();
//         break;
//       }
//     case ActionTypes.REMOVE_VOXEL:
//       {
//         const { position } = op.voxel;
//         voxelData.set(position.z - 1, position.y - 1, position.x - 1, 0);
//         updateVoxelGeometry();
//         break;
//       }
//     case ActionTypes.REMOVE_VOXEL_BATCH:
//       {
//         op.voxels.forEach(voxel => {
//           const { position } = voxel;
//           voxelData.set(position.z - 1, position.y - 1, position.x - 1, 0);
//         });
//         updateVoxelGeometry();
//         break;
//       }
//     case ActionTypes.VOXEL_UNDO:
//     case ActionTypes.VOXEL_UNDO_SEEK:
//     case ActionTypes.VOXEL_REDO:
//     case ActionTypes.VOXEL_REDO_SEEK:
//     case ActionTypes.VOXEL_ROTATE:
//     case ActionTypes.LOAD_WORKSPACE:
//       reloadVoxelData();
//       updateVoxelGeometry();
//       break;
//   }
// });
