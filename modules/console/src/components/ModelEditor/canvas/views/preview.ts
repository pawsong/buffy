import * as THREE from 'three';
import * as ndarray from 'ndarray';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../../constants/Pixels';

import {
  PIXEL_SCALE,
  DESIGN_IMG_SIZE,
  DESIGN_SCALE,
} from '../../../../canvas/Constants';

import Stores from '../stores';

import { ModelEditorState } from '../../types';

const size = GRID_SIZE * UNIT_PIXEL;

interface PreviewViewOptions {
  container: HTMLElement;
  stores: Stores;
}

class PreviewView {
  renderer: THREE.WebGLRenderer;
  onWindowResize: () => any;

  constructor({
    container,
    stores,
  }: PreviewViewOptions) {
    const scene = new THREE.Scene();

    const previewCamera = new THREE.OrthographicCamera(
      container.clientWidth / - 2,
      container.clientWidth / 2,
      container.clientHeight / 2,
      container.clientHeight / - 2,
      -500, 1000
    );
    // previewCamera.position.copy(camera.position).multiplyScalar(0.1);

    /////////////////////////////////////////////////////////////
    // INITIALIZE
    /////////////////////////////////////////////////////////////

    const renderer = this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setClearColor( 0xffffff );
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Hide ghost bottom margin
    renderer.domElement.style['vertical-align'] = 'bottom';
    renderer.domElement.style.position = 'relative';
    container.appendChild(renderer.domElement);

    var ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(5, 3, 4);
    light.position.normalize();
    scene.add(light);

    const target = new THREE.Vector3(
      DESIGN_IMG_SIZE * DESIGN_SCALE / 2 / 3,
      DESIGN_IMG_SIZE * DESIGN_SCALE / 4 / 3,
      DESIGN_IMG_SIZE * DESIGN_SCALE / 2 / 3
    );

    let surfacemesh;
    stores.meshStore.listen((geometry) => {
      if (surfacemesh) {
        // TODO: dispose geometry and material
        scene.remove(surfacemesh);
        surfacemesh = undefined;
      }

      if (geometry.vertices.length === 0) return;

      // Create surface mesh
      var material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        vertexColors: THREE.VertexColors,
      });
      surfacemesh = new THREE.Mesh( geometry, material );
      surfacemesh.doubleSided = false;
      //surfacemesh.scale.set(5, 5, 5);
      surfacemesh.scale.set(
        BOX_SIZE,
        BOX_SIZE,
        BOX_SIZE
      ).multiplyScalar(0.1);
      surfacemesh.position.set(
        -GRID_SIZE * BOX_SIZE / 2,
        -GRID_SIZE * BOX_SIZE / 2,
        -GRID_SIZE * BOX_SIZE / 2
      ).multiplyScalar(0.1);
      //surfacemesh.scale.set(BOX_SIZE, BOX_SIZE, BOX_SIZE);
      scene.add(surfacemesh);

      render();
    });

    stores.cameraPositionStore.listen(position => {
      previewCamera.position.set(position[0], position[1], position[2]).multiplyScalar(DESIGN_SCALE / PIXEL_SCALE / 3);
      render();
    });

    function render() {
      previewCamera.lookAt(target);
      renderer.render(scene, previewCamera);
    }

    this.onWindowResize = () => {
      previewCamera.left = container.clientWidth / - 2;
      previewCamera.right = container.clientWidth / 2;
      previewCamera.top = container.clientHeight / 2;
      previewCamera.bottom = container.clientHeight / - 2;
      previewCamera.updateProjectionMatrix();

      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Add event handlers
    window.addEventListener('resize', this.onWindowResize, false);

  }

  resize() {
    this.onWindowResize();
  }

  updateState(nextState: ModelEditorState) {
  }

  destroy() {
    window.removeEventListener('resize', this.onWindowResize, false);
    this.renderer.forceContextLoss();
    this.renderer.context = null;
    this.renderer.domElement = null;
  }
}

export default PreviewView;
