import * as THREE from 'three';

interface Resources {
  geometry?: THREE.Geometry;
  material?: THREE.Material;
}

// TODO: Manage reference count on each geometry and material
//       which are reused multiple times across different objects
export class SmartObject {
  group: THREE.Group;
  geometries: THREE.Geometry[] = [];
  materials: THREE.Material[] = [];

  constructor(group: THREE.Object3D) {
    this.group = group;
  }

  add(mesh: THREE.Mesh, resources?: Resources) {
    this.group.add(mesh);
    if (!resources) { return; }

    if (resources.geometry) {
      this.geometries.push(resources.geometry);
    }
    if (resources.material) {
      this.materials.push(resources.material);
    }
  }

  reset() {
    for (let i = this.group.children.length - 1; i >= 0; --i) {
      const child = this.group.children[i];
      this.group.remove(child);
    }

    this.dispose();

    this.geometries = [];
    this.materials = [];
  }

  dispose() {
    this.geometries.forEach(geometry => geometry.dispose());
    this.materials.forEach(material => material.dispose());
  }
}

class ObjectManager {
  scene: THREE.Scene;
  objects: {
    [index: string]: SmartObject;
  } = {};

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  create(id: string): SmartObject {
    if (this.objects[id]) {
      throw new Error(`Object ${id} already exists`);
    }
    const group = new THREE.Group();
    this.scene.add(group);

    const object = new SmartObject(group);
    this.objects[id] = object;
    return object;
  }

  find(id: string): SmartObject {
    return this.objects[id];
  }

  remove(id: string) {
    const object = this.objects[id];
    if (!object) {
      throw new Error(`Object ${id} does not exist`);
    }
    this.scene.remove(object.group);

    object.reset();
    delete this.objects[id];
  }

  removeAll() {
    Object.keys(this.objects).forEach(id => this.remove(id));
  }
}

export default ObjectManager;
