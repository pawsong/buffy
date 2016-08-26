import * as THREE from 'three';
import ndarray from 'ndarray';
const invariant = require('fbjs/lib/invariant');

import { WeakTable2 } from '../../../canvas/WeakTable';

import {
  PIXEL_SCALE,
} from '../../../canvas/Constants';

import mesher from '../../../canvas/meshers/greedy2';
import { createGeometryFromMesh } from '../../../canvas/utils';

import getSlice from '../utils/getSlice';

import {
  Axis,
} from '../types';

interface CacheMap {
  [index: string]: THREE.Mesh[];
}

class MaskSliceCache {
  private data: WeakTable2<ndarray.Ndarray, ndarray.Ndarray, CacheMap>;
  private temp1: THREE.Vector3;

  private defaultValue: number;

  constructor(private materials: THREE.Material[], defaultValue: number) {
    this.data = new WeakTable2();
    this.temp1 = new THREE.Vector3();
    this.defaultValue = defaultValue;
  }

  get(array: ndarray.Ndarray, mask: ndarray.Ndarray, axis: Axis, position: number) {
    let cache = this.data.get(array, mask);
    if (!cache) {
      cache = {};
      this.data.set(array, mask, cache);
    }

    const key = `${Axis[axis]}/${position}`;
    if (cache.hasOwnProperty(key)) return cache[key];

    const subarray = getSlice(axis, position, array);
    const submask = getSlice(axis, position, mask);
    this.temp1.set(0, 0, 0).setComponent(axis, position * PIXEL_SCALE);

    const geometry = createGeometryFromMesh(mesher(subarray, submask, this.defaultValue));
    if (geometry.vertices.length === 0) {
      return cache[key] = null;
    }

    const meshes = this.materials.map(material => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
      mesh.position.copy(this.temp1);
      mesh.userData.data = subarray;
      return mesh;
    });

    return cache[key] = meshes;
  }
}

export default MaskSliceCache;
