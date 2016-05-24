import * as THREE from 'three';
import * as ndarray from 'ndarray';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../constants/Pixels';

import {
  PIXEL_SCALE,
  DESIGN_IMG_SIZE,
  DESIGN_SCALE,
} from '../../../canvas/Constants';

import Canvas from '../../../canvas/Canvas';

import Stores from './stores';

import {
  ModelEditorState,
  CameraStore,
  Position,
} from '../types';

const size = GRID_SIZE * UNIT_PIXEL;

interface PreviewViewOptions {
  container: HTMLElement;
  stores: Stores;
  cameraStore: CameraStore;
}

class PreviewCanvas extends Canvas {
  camera: THREE.OrthographicCamera;

  private material: THREE.Material;
  private cameraStore: CameraStore;

  private mesh: THREE.Mesh;
  private target: THREE.Vector3;
  private stores: Stores;

  constructor({
    container,
    stores,
    cameraStore,
  }: PreviewViewOptions) {
    super(container);
    this.cameraStore = cameraStore;

    this.target = new THREE.Vector3(
      DESIGN_IMG_SIZE * DESIGN_SCALE / 2 / 3,
      DESIGN_IMG_SIZE * DESIGN_SCALE / 4 / 3,
      DESIGN_IMG_SIZE * DESIGN_SCALE / 2 / 3
    );

    this.material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
    });

    this.stores = stores;
  }

  init() {
    super.init();

    this.renderer.setClearColor( 0xffffff );

    this.stores.meshStore.listen(this.handleMeshGeometryChanage);
    this.cameraStore.listen(this.handleCameraPositionChange);

    this.render();
  }

  initCamera() {
    const camera = new THREE.OrthographicCamera(
      this.container.clientWidth / - 2,
      this.container.clientWidth / 2,
      this.container.clientHeight / 2,
      this.container.clientHeight / - 2,
      -500, 1000
    );

    return camera;
  }

  render() {
    this.camera.lookAt(this.target);
    this.renderer.render(this.scene, this.camera);
  }

  handleWindowResize() {
    this.camera.left = this.container.clientWidth / - 2;
    this.camera.right = this.container.clientWidth / 2;
    this.camera.top = this.container.clientHeight / 2;
    this.camera.bottom = this.container.clientHeight / - 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  onCameraStoreChange(cameraStore: CameraStore) {
    this.cameraStore.unlisten(this.handleCameraPositionChange);
    this.cameraStore = cameraStore;
    this.cameraStore.listen(this.handleCameraPositionChange);
  }

  handleCameraPositionChange = (position: Position) => {
    this.camera.position.set(position[0], position[1], position[2]).multiplyScalar(DESIGN_SCALE / PIXEL_SCALE / 3);
    this.render();
  }

  handleMeshGeometryChanage = (geometry: THREE.Geometry) => {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh = undefined;
    }

    if (geometry.vertices.length === 0) return;

    // Create surface mesh
    this.mesh = new THREE.Mesh(geometry, this.material);

    this.mesh.scale.set(
      BOX_SIZE,
      BOX_SIZE,
      BOX_SIZE
    ).multiplyScalar(0.1);
    this.mesh.position.set(
      -GRID_SIZE * BOX_SIZE / 2,
      -GRID_SIZE * BOX_SIZE / 2,
      -GRID_SIZE * BOX_SIZE / 2
    ).multiplyScalar(0.1);

    this.scene.add(this.mesh);

    this.render();
  }

  destroy() {
    super.destroy();
  }
}

export default PreviewCanvas;
