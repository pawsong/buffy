import * as THREE from 'three';

export function createVoxelGeometry(vertices: any[], faces: any[]) {
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
