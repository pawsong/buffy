import THREE from 'three';
import ndarray from 'ndarray';
import mesher from '../meshers/trove';
import { createGeometryFromMesh } from '../utils';

import { WeakTable4 } from '../WeakTable';

class TroveGeometryFactory {
  private cache: WeakTable4<ndarray.Ndarray, ndarray.Ndarray, ndarray.Ndarray, ndarray.Ndarray, THREE.Geometry>;

  constructor() {
    this.cache = new WeakTable4<ndarray.Ndarray, ndarray.Ndarray, ndarray.Ndarray, ndarray.Ndarray, THREE.Geometry>();
  }

  getGeometry(data: ndarray.Ndarray, type: ndarray.Ndarray, alpha: ndarray.Ndarray, specular: ndarray.Ndarray) {
    const cached = this.cache.get(data, type, alpha, specular);
    if (cached) return cached;

    const mesh = mesher(data, type, alpha, specular);
    const geometry = createGeometryFromMesh(mesh);

    this.cache.set(data, type, alpha, specular, geometry);
    return geometry;
  }
}

export default TroveGeometryFactory;
