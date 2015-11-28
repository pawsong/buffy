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
      x: this._canvasSize.width / 2 + (screenPos.z + UNIT_PIXEL) / BOX_SIZE,
      y: this._canvasSize.depth / 2 + (screenPos.x + UNIT_PIXEL) / BOX_SIZE,
      z: (screenPos.y - PLANE_Y_OFFSET + UNIT_PIXEL) / BOX_SIZE,
    };
  }

  toScreenPos(absPos) {
    return {
      x: absPos.y * BOX_SIZE - UNIT_PIXEL - this._canvasSize.width / 2 * BOX_SIZE,
      z: absPos.x * BOX_SIZE - UNIT_PIXEL - this._canvasSize.depth / 2 * BOX_SIZE,
      y: absPos.z * BOX_SIZE - UNIT_PIXEL + PLANE_Y_OFFSET,
    };
  }

  add(position, color) {
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

    const wireMesh =  new THREE.EdgesHelper( mesh, 0x303030 );
    wireMesh.position.copy(mesh.position);
    wireMesh.visible = true;
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
    for (let voxel in this._voxels) {
    }
  }
}

export default VoxelManager;
