import * as THREE from 'three';
import ndarray from 'ndarray';
const invariant = require('fbjs/lib/invariant');

import { WeakTable4 } from '../../../canvas/WeakTable';

import {
  PIXEL_SCALE,
} from '../../../canvas/Constants';

import mesher from '../../../canvas/meshers/trove';
import { createGeometryFromMesh } from '../../../canvas/utils';

import getSlice from '../utils/getSlice';

import {
  Axis,
} from '../types';

interface CacheMap {
  [index: string]: THREE.Mesh[];
}

class MaskSliceCache {
  private data: WeakTable4<ndarray.Ndarray, ndarray.Ndarray, ndarray.Ndarray, ndarray.Ndarray, CacheMap>;
  private temp1: THREE.Vector3;

  constructor(private materials: THREE.Material[]) {
    this.data = new WeakTable4();
    this.temp1 = new THREE.Vector3();
  }

  get(
    data: ndarray.Ndarray, type: ndarray.Ndarray, alpha: ndarray.Ndarray, specular: ndarray.Ndarray,
    axis: Axis, position: number
  ) {
    let cache = this.data.get(data, type, alpha, specular);
    if (!cache) {
      cache = {};
      this.data.set(data, type, alpha, specular, cache);
    }

    const key = `${Axis[axis]}/${position}`;
    if (cache.hasOwnProperty(key)) return cache[key];

    const subdata = getSlice(axis, position, data);
    const subtype = getSlice(axis, position, type);
    const subalpha = getSlice(axis, position, alpha);
    const subspecular = getSlice(axis, position, specular);
    this.temp1.set(0, 0, 0).setComponent(axis, position * PIXEL_SCALE);

    const geometry = createGeometryFromMesh(mesher(subdata, subtype, subalpha, subspecular));
    if (geometry.vertices.length === 0) {
      return cache[key] = null;
    }

    const meshes = this.materials.map(material => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
      mesh.position.copy(this.temp1);
      mesh.userData.data = subdata;
      return mesh;
    });

    return cache[key] = meshes;
  }
}

export default MaskSliceCache;
