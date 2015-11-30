import THREE from 'three';
import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../constants/Pixels';

const cube = new THREE.CubeGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);

class Voxel {
  constructor(scene) {
    const brushMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    const mesh = new THREE.Mesh(cube, brushMaterial);
    mesh.isBrush = true;
    mesh.visible = false;
    mesh.overdraw = false;
    scene.add(mesh);

    const wireMesh = new THREE.EdgesHelper(mesh, 0x000000);
    wireMesh.visible = false;
    wireMesh.material.transparent = true;
    wireMesh.material.opacity = 0.8;
    scene.add(wireMesh);

    this.mesh = mesh;
    this.wireMesh = wireMesh;
  }

  hide() {
    this.mesh.visible = false;
    this.wireMesh.visible = false;
  }

  isVisible() {
    return this.mesh.visible;
  }

  get position() {
    return this.mesh.position;
  }

  move(position) {
    this.mesh.visible = true;
    this.wireMesh.visible = true;
    this.mesh.position.copy(position);
  }
}

export default Voxel;
