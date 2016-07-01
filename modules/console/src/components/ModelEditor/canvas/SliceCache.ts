import THREE from 'three';
import ndarray from 'ndarray';
const invariant = require('fbjs/lib/invariant');

import {
  PIXEL_SCALE,
} from '../../../canvas/Constants';

import mesher from '../../../canvas/meshers/greedy';
import { createGeometryFromMesh } from '../../../canvas/utils';

import {
  Axis,
} from '../types';

interface CacheMap {
  [index: string]: THREE.Mesh[];
}

class SliceCache {
  private data: WeakMap<ndarray.Ndarray, CacheMap>;
  private temp1: THREE.Vector3;

  constructor(private materials: THREE.Material[]) {
    this.data = new WeakMap();
    this.temp1 = new THREE.Vector3();
  }

  get(array: ndarray.Ndarray, axis: Axis, position: number) {
    let cache = this.data.get(array);
    if (!cache) {
      cache = {};
      this.data.set(array, cache);
    }

    const key = `${Axis[axis]}/${position}`;
    if (cache.hasOwnProperty(key)) return cache[key];

    let subarray: ndarray.Ndarray;

    switch(axis) {
      case Axis.X: {
        subarray = ndarray(
          array.data,
          [1, array.shape[1], array.shape[2]],
          array.stride,
          array.stride[0] * position
        );
        this.temp1.set(position * PIXEL_SCALE, 0, 0);
        break;
      }
      case Axis.Y: {
        subarray = ndarray(
          array.data,
          [array.shape[1], 1, array.shape[2]],
          array.stride,
          array.stride[1] * position
        );
        this.temp1.set(0, position * PIXEL_SCALE, 0);
        break;
      }
      case Axis.Z: {
        subarray = ndarray(
          array.data,
          [array.shape[1], array.shape[1], 1],
          array.stride,
          array.stride[2] * position
        );
        this.temp1.set(0, 0, position * PIXEL_SCALE);
        break;
      }
      default: {
        invariant(false, `Invalid axis: ${axis}`);
      }
    }

    const geometry = createGeometryFromMesh(mesher(subarray));
    if (geometry.vertices.length === 0) {
      return cache[key] = null;
    }

    const meshes = this.materials.map(material => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
      mesh.position.copy(this.temp1);
      return mesh;
    });

    return cache[key] = meshes;
  }
}

export default SliceCache;
