import * as THREE from 'three';
import Mesh from '@pasta/core/lib/classes/Mesh';
import {
  MINI_PIXEL_SIZE,
  PIXEL_NUM,
} from '../Constants';

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

  changeMesh(mesh: Mesh) {
    this.reset();

    const geometry = new THREE.Geometry();

    geometry.vertices.length = 0;
    geometry.faces.length = 0;
    for(var i = 0; i < mesh.vertices.length; ++i) {
      var q = mesh.vertices[i];
      geometry.vertices.push(new THREE.Vector3(q[0], q[1], q[2]));
    }
    for(var i = 0; i < mesh.faces.length; ++i) {
      const q = mesh.faces[i];
      const f = new THREE.Face3(q[0], q[1], q[2]);
      f.color = new THREE.Color(q[3]);
      f.vertexColors = [f.color,f.color,f.color];
      geometry.faces.push(f);
    }

    geometry.computeFaceNormals()

    geometry.verticesNeedUpdate = true;
    geometry.elementsNeedUpdate = true;
    geometry.normalsNeedUpdate = true;

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    // Create surface mesh
    var material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
    });
    const surfacemesh = new THREE.Mesh( geometry, material );
    // surfacemesh.doubleSided = false;
    surfacemesh.position.x = MINI_PIXEL_SIZE * - PIXEL_NUM / 2.0;
    surfacemesh.position.y = MINI_PIXEL_SIZE * - PIXEL_NUM / 2.0;
    surfacemesh.position.z = MINI_PIXEL_SIZE * - PIXEL_NUM / 2.0;
    surfacemesh.scale.set(MINI_PIXEL_SIZE, MINI_PIXEL_SIZE, MINI_PIXEL_SIZE);

    this.add(surfacemesh, { geometry, material });
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
