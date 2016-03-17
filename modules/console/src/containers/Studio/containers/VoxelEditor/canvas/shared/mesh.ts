import { Ndarray } from 'ndarray';
import * as THREE from 'three';
import { take, select } from 'redux-saga/effects';

import mesher, { GridFace } from '../meshers/greedy';

import { SimpleStore } from '../../../../libs';

import {
  rgbToHex,
  voxelMapToArray,
} from '../utils';

import { State } from '../../../../../../reducers';
import { VoxelState } from '../../../../../../reducers/voxelEditor';

import {
  VOXEL_ADD_BATCH, VoxelAddBatchAction,
  VOXEL_REMOVE, VoxelRemoveAction,
  VOXEL_REMOVE_BATCH, VoxelRemoveBatchAction,
  VOXEL_UNDO,
  VOXEL_UNDO_SEEK,
  VOXEL_REDO,
  VOXEL_REDO_SEEK,
  VOXEL_ROTATE,
  LOAD_WORKSPACE,
  UPDATE_WORKSPACE,
} from '../../../../../../actions/voxelEditor';

interface Mesh {
  geometry: THREE.Geometry;
  gridFaces: GridFace[];
}

export type MeshStore = SimpleStore<Mesh>;

function createVoxelGeometry(vertices: any[], faces: any[]) {
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

  geometry.computeFaceNormals()

  geometry.verticesNeedUpdate = true
  geometry.elementsNeedUpdate = true
  geometry.normalsNeedUpdate = true

  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

  return geometry;
}

export function* watchVoxelChange(getState, store: MeshStore) {
  const voxel: VoxelState = yield select<State>(state => state.voxelEditor.voxel);
  let voxelData = voxelMapToArray(voxel.present.data);

  while(true) {
    const action = yield take([
      VOXEL_ADD_BATCH,
      VOXEL_REMOVE_BATCH,
      VOXEL_UNDO,
      VOXEL_UNDO_SEEK,
      VOXEL_REDO,
      VOXEL_REDO_SEEK,
      VOXEL_ROTATE,
      LOAD_WORKSPACE,
      UPDATE_WORKSPACE,
    ]);

    switch(action.type) {
      case VOXEL_ADD_BATCH: {
        const { voxels } = <VoxelAddBatchAction>action;
        voxels.forEach(voxel => {
          const { position, color } = voxel;
          voxelData.set(position.z - 1, position.y - 1, position.x - 1, rgbToHex(color));
        });
        break;
      }
      case VOXEL_REMOVE: {
        const { position } = <VoxelRemoveAction>action;
        voxelData.set(position.z - 1, position.y - 1, position.x - 1, 0);
        break;
      }
      case VOXEL_REMOVE_BATCH: {
        const { positions } = <VoxelRemoveBatchAction>action;
        positions.forEach(position => {
          voxelData.set(position.z - 1, position.y - 1, position.x - 1, 0);
        });
        break;
      }
      default: {
        const voxel: VoxelState = yield select<State>(state => state.voxelEditor.voxel);
        voxelData = voxelMapToArray(voxel.present.data);
        break;
      }
    }

    const { geometry } = store.getState();

    const { vertices, faces, gridFaces } = mesher(voxelData.data, voxelData.shape);
    const nextGeometry = createVoxelGeometry(vertices, faces);
    store.update({ geometry: nextGeometry, gridFaces });

    // Prevent memory leak
    if (geometry) geometry.dispose();
  }
}
