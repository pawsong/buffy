import THREE from 'three';
import { vector3ToString } from '@pasta/helper-public';
import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../constants/Pixels';

const cube = new THREE.CubeGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);

class VoxelManager {
  constructor(scene, canvasSize) {
    this._scene = scene;
    this._canvasSize = canvasSize;
    this._voxels = {};
  }

  toAbsPos(screenPos) {
    return {
      x: this._canvasSize.width / 2 + (screenPos.x + UNIT_PIXEL) / BOX_SIZE,
      y: (screenPos.y - PLANE_Y_OFFSET + UNIT_PIXEL) / BOX_SIZE,
      z: this._canvasSize.depth / 2 + (screenPos.z + UNIT_PIXEL) / BOX_SIZE,
    };
  }

  toScreenPos(absPos) {
    return {
      x: absPos.x * BOX_SIZE - UNIT_PIXEL - this._canvasSize.width / 2 * BOX_SIZE,
      y: absPos.y * BOX_SIZE - UNIT_PIXEL + PLANE_Y_OFFSET,
      z: absPos.z * BOX_SIZE - UNIT_PIXEL - this._canvasSize.depth / 2 * BOX_SIZE,
    };
  }

  get maxX() {
    return this._canvasSize.width;
  }

  get maxY() {
    return this._canvasSize.depth;
  }

  get maxZ() {
    return this._canvasSize.height;
  }

  add(position, color) {
    this.remove(position);

    var cubeMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      transparent: true,
    });
    cubeMaterial.color.setStyle(`rgba(${color.r},${color.g},${color.b},${color.a})`);

    const mesh = new THREE.Mesh( cube, cubeMaterial )
    mesh.position.copy(this.toScreenPos(position));
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.overdraw = true;
    this._scene.add(mesh);

    const wireMesh =  new THREE.EdgesHelper( mesh, 0x000000 );
    wireMesh.visible = true;
    wireMesh.material.transparent = true;
    wireMesh.material.opacity = 0.6;
    wireMesh.position.copy(mesh.position);
    this._scene.add(wireMesh);

    const voxel = {
      position,
      color,
      mesh,
      wireMesh,
    };

    mesh.voxel = voxel;

    this._voxels[vector3ToString(position)] = voxel;
  }

  remove(position) {
    const key = vector3ToString(position);
    const voxel = this._voxels[key];
    if (voxel) {
      this._scene.remove(voxel.mesh);
      this._scene.remove(voxel.wireMesh);
      delete this._voxels[key];
    }
  }

  reset() {
    for (let key in this._voxels) {
      const voxel = this._voxels[key];
      this._scene.remove(voxel.mesh);
      this._scene.remove(voxel.wireMesh);
    }
    this._voxels = {};
  }
}

export default VoxelManager;
