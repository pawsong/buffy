import * as THREE from 'three';
import { Mesh } from '@pasta/core/lib/types';

function createFaceVertexUv(vertices: any[], i: number) {
  const vs = [
    vertices[i*4+0],
    vertices[i*4+1],
    vertices[i*4+2],
    vertices[i*4+3],
  ]

  const spans = {
    x0: vs[0][0] - vs[1][0],
    x1: vs[1][0] - vs[2][0],
    y0: vs[0][1] - vs[1][1],
    y1: vs[1][1] - vs[2][1],
    z0: vs[0][2] - vs[1][2],
    z1: vs[1][2] - vs[2][2],
  }

  const size = {
    x: Math.max(Math.abs(spans.x0), Math.abs(spans.x1)),
    y: Math.max(Math.abs(spans.y0), Math.abs(spans.y1)),
    z: Math.max(Math.abs(spans.z0), Math.abs(spans.z1)),
  }

  let width;
  let height;

  if (size.x === 0) {
    if (spans.y0 > spans.y1) {
      width = size.y;
      height = size.z;
    } else {
      width = size.z;
      height = size.y;
    }
  }

  if (size.y === 0) {
    if (spans.x0 > spans.x1) {
      width = size.x;
      height = size.z;
    } else {
      width = size.z;
      height = size.x;
    }
  }

  if (size.z === 0) {
    if (spans.x0 > spans.x1) {
      width = size.x;
      height = size.y;
    } else {
      width = size.y;
      height = size.x;
    }
  }

  if ((size.z === 0 && spans.x0 < spans.x1) || (size.x === 0 && spans.y0 > spans.y1)) {
    return [
      new THREE.Vector2(height, 0),
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0, width),
      new THREE.Vector2(height, width),
    ];
  } else {
    return [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0, height),
      new THREE.Vector2(width, height),
      new THREE.Vector2(width, 0),
    ];
  }
}

export function createGeometryFromMesh({ vertices, faces }: Mesh) {
  const geometry = new THREE.Geometry();

  geometry.vertices.length = 0;
  geometry.faces.length = 0;

  for(let i = 0, l = vertices.length; i < l; ++i) {
    const q = vertices[i];
    geometry.vertices.push(new THREE.Vector3(q[0], q[1], q[2]));
  }

  for(let i = 0, l = faces.length; i < l; ++i) {
    const q = faces[i];

    const uv = createFaceVertexUv(vertices, i);

    const materialIndex = (q[4] & 0xff000000) >> 24;

    const f = new THREE.Face3(q[0], q[1], q[3]);
    f.color = new THREE.Color(q[4]);
    f.materialIndex = materialIndex;

    geometry.faces.push(f);
    geometry.faceVertexUvs[0].push([uv[0], uv[1], uv[3]]);

    const g = new THREE.Face3(q[1], q[2], q[3]);
    g.color = new THREE.Color(q[4]);
    g.materialIndex = materialIndex;

    geometry.faces.push(g);
    geometry.faceVertexUvs[0].push([uv[1], uv[2], uv[3]]);
  }

  geometry.mergeVertices();

  geometry.computeFaceNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  geometry.verticesNeedUpdate = true;
  geometry.elementsNeedUpdate = true;
  geometry.normalsNeedUpdate = true;

  return geometry;
}
