import * as THREE from 'three';
import * as ndarray from 'ndarray';
import mesher from '../meshers/outline';
import { createGeometryFromMesh } from '../utils';

class OutlineGeometryFactory {
  private cache: WeakMap<ndarray.Ndarray, THREE.Geometry>;

  constructor() {
    this.cache = new WeakMap<ndarray.Ndarray, THREE.Geometry>();
  }

  getGeometry(data: ndarray.Ndarray) {
    const cached = this.cache.get(data);
    if (cached) return cached;

    const mesh = mesher(data);
    const geometry = createGeometryFromMesh(mesh);

    this.cache.set(data, geometry);
    return geometry;
  }
}

export default OutlineGeometryFactory;
