import * as THREE from 'three';

abstract class SelectionBox {
  mesh: THREE.Mesh;

  constructor() {
    this.mesh = this.createMesh();
  }

  abstract createMesh(): THREE.Mesh;

  abstract show(visible: boolean);

  abstract resize(width: number, height: number, depth: number);
}

export default SelectionBox;
