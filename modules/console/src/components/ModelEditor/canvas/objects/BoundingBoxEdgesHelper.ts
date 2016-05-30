import * as THREE from 'three';

class BoundingBoxEdgesHelper {
  object: THREE.Object3D;
  box: THREE.Box3;
  edges: THREE.LineSegments;

  constructor(object: THREE.Object3D, hex: number) {
    this.object = object;
  	this.box = new THREE.Box3();

    this.edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxBufferGeometry(1, 1, 1), 1),
      new THREE.LineBasicMaterial({ color: hex })
    );
  }

  update() {
    this.box.setFromObject(this.object);
    this.box.size(this.edges.scale);
    this.box.center(this.edges.position);
  }

  changeTarget(object: THREE.Object3D) {
    this.object = object;
    this.update();
  }

  dispose() {
    this.object = null;

    this.edges.geometry.dispose();
    this.edges.material.dispose();
    this.edges = null;
  }
}

export default BoundingBoxEdgesHelper;
