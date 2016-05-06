import * as THREE from 'three';
const invariant = require('fbjs/lib/invariant');
import {
  MINI_PIXEL_SIZE,
  PIXEL_NUM,
} from './Constants';
import DesignManager, { LoaderWatcher } from '../DesignManager';

interface Resources {
  material?: THREE.Material;
}

// TODO: Manage reference count on each geometry and material
//       which are reused multiple times across different objects
export class SmartObject {
  group: THREE.Group;
  designId: string;
  watcher: LoaderWatcher;
  materials: THREE.Material[];

  constructor(group: THREE.Object3D, designId: string) {
    this.group = group;
    this.designId = designId;
    this.watcher = geometry => this.changeMesh(geometry);
    this.materials = [];
  }

  add(mesh: THREE.Mesh, resources?: Resources) {
    this.group.add(mesh);
    if (!resources) { return; }

    if (resources.material) this.materials.push(resources.material);
  }

  reset() {
    for (let i = this.group.children.length - 1; i >= 0; --i) {
      const child = this.group.children[i];
      this.group.remove(child);
    }
    this.dispose();
  }

  dispose() {
    this.materials.forEach(material => material.dispose());
    this.materials = [];
  }

  changeMesh(geometry: THREE.Geometry) {
    this.reset();
    if (geometry.vertices.length === 0 || geometry.faces.length === 0) return;

    // Create surface mesh
    const material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
    });
    const surfacemesh = new THREE.Mesh(geometry, material);
    // surfacemesh.doubleSided = false;
    surfacemesh.position.x = MINI_PIXEL_SIZE * - PIXEL_NUM / 2.0;
    surfacemesh.position.y = MINI_PIXEL_SIZE * - PIXEL_NUM / 2.0;
    surfacemesh.position.z = MINI_PIXEL_SIZE * - PIXEL_NUM / 2.0;
    surfacemesh.scale.set(MINI_PIXEL_SIZE, MINI_PIXEL_SIZE, MINI_PIXEL_SIZE);

    this.add(surfacemesh, { material });
  }
}

class ObjectManager {
  scene: THREE.Scene;
  objects: { [index: string]: SmartObject };
  designManager: DesignManager;

  constructor(scene: THREE.Scene, designManager: DesignManager) {
    this.scene = scene;
    this.objects = {};
    this.designManager = designManager;
  }

  create(id: string, designId: string): SmartObject {
    invariant(!this.objects[id], `Object ${id} already exists`);

    const group = new THREE.Group();
    this.scene.add(group);

    const object = new SmartObject(group, designId);
    this.objects[id] = object;

    this.designManager.watch(designId, object.watcher);

    return object;
  }

  find(id: string): SmartObject {
    return this.objects[id];
  }

  remove(id: string) {
    const object = this.objects[id];
    invariant(object, `Object ${id} does not exist`);
    this.scene.remove(object.group);
    object.reset();

    this.designManager.unwatch(object.designId, object.watcher);

    delete this.objects[id];
  }

  removeAll() {
    Object.keys(this.objects).forEach(id => this.remove(id));
  }
}

export default ObjectManager;
