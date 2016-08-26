import * as THREE from 'three';
import ndarray from 'ndarray';
import mesher from '../meshers/greedy2';
import { createGeometryFromMesh } from '../utils';

import { WeakTable2 } from '../WeakTable';

const nullArray: any = {};

class MaskGeometryFactory {
  private cache: WeakTable2<ndarray.Ndarray, ndarray.Ndarray, THREE.Geometry>;
  private defaultValue: number;

  constructor(defaultValue: number) {
    this.cache = new WeakTable2<ndarray.Ndarray, ndarray.Ndarray, THREE.Geometry>();
    this.defaultValue = defaultValue;
  }

  getGeometry(data: ndarray.Ndarray, mask: ndarray.Ndarray) {
    const key = data || nullArray;

    const cached = this.cache.get(key, mask);
    if (cached) return cached;

    const mesh = mesher(data, mask, this.defaultValue);
    const geometry = createGeometryFromMesh(mesh);

    this.cache.set(key, mask, geometry);
    return geometry;
  }
}

export default MaskGeometryFactory;
