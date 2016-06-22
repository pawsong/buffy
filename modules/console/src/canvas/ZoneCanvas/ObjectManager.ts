import THREE from 'three';
const invariant = require('fbjs/lib/invariant');
import {
  PIXEL_SCALE,
  DESIGN_SCALE,
  PIXEL_SCALE_HALF,
} from '../Constants';
import ModelManager, { LoaderWatcher } from '../ModelManager';

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
  manager: ObjectManager;

  constructor(manager: ObjectManager, group: THREE.Object3D, designId: string) {
    this.manager = manager;
    this.group = group;
    this.designId = designId;
    this.watcher = geometry => this.changeMesh(geometry);
    this.materials = [];
  }

  add(mesh: THREE.Mesh, resources?: Resources) {
    this.group.add(mesh);
    this.manager.object3Ds.push(mesh);

    if (!resources) { return; }

    if (resources.material) this.materials.push(resources.material);
  }

  remove(mesh: THREE.Object3D) {
    this.group.remove(mesh);
    const index = this.manager.object3Ds.indexOf(mesh);
    if (index !== -1) this.manager.object3Ds.splice(index, 1);
  }

  reset() {
    for (let i = this.group.children.length - 1; i >= 0; --i) {
      const child = this.group.children[i];
      this.remove(child);
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
    surfacemesh.position.x = - PIXEL_SCALE_HALF;
    surfacemesh.position.y = - PIXEL_SCALE_HALF;
    surfacemesh.position.z = - PIXEL_SCALE_HALF;

    surfacemesh.castShadow = true;

    this.add(surfacemesh, { material });
  }
}

class ObjectManager {
  scene: THREE.Scene;
  objects: { [index: string]: SmartObject };
  object3Ds: THREE.Object3D[];

  modelManager: ModelManager;

  constructor(scene: THREE.Scene, modelManager: ModelManager) {
    this.scene = scene;
    this.objects = {};
    this.object3Ds = [];
    this.modelManager = modelManager;
  }

  create(id: string, designId: string): SmartObject {
    invariant(!this.objects[id], `Object ${id} already exists`);

    const group = new THREE.Group();
    this.scene.add(group);

    const object = new SmartObject(this, group, designId);
    this.objects[id] = object;
    this.modelManager.watch(designId, object.watcher);

    return object;
  }

  find(id: string): SmartObject {
    return this.objects[id];
  }

  changeDesign(id: string, designId: string) {
    const object = this.find(id);
    if (!object) return;
    this.modelManager.unwatch(object.designId, object.watcher);
    object.designId = designId;
    this.modelManager.watch(object.designId, object.watcher);
  }

  remove(id: string) {
    const object = this.objects[id];
    invariant(object, `Object ${id} does not exist`);

    this.scene.remove(object.group);
    object.reset();

    this.modelManager.unwatch(object.designId, object.watcher);

    delete this.objects[id];
  }

  removeAll() {
    Object.keys(this.objects).forEach(id => this.remove(id));
  }
}

export default ObjectManager;
