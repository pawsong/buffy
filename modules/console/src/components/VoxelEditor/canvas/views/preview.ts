import * as THREE from 'three';
import * as ndarray from 'ndarray';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../../constants/Pixels';

import CanvasShared from '../shared';

import { VoxelEditorState } from '../../interface';

const size = GRID_SIZE * UNIT_PIXEL;

interface PreviewViewOptions {
  container: HTMLElement;
  canvasShared: CanvasShared;
}

class PreviewView {
  renderer: THREE.WebGLRenderer;
  frameId: number;
  onWindowResize: () => any;

  constructor({
    container,
    canvasShared,
  }: PreviewViewOptions) {
    const scene = new THREE.Scene();

    const previewCamera = new THREE.OrthographicCamera(
      container.offsetWidth / - 2,
      container.offsetWidth / 2,
      container.offsetHeight / 2,
      container.offsetHeight / - 2,
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
    renderer.setClearColor( 0x101010 );
    renderer.setSize(container.offsetWidth, container.offsetHeight);

    // Hide ghost bottom margin
    renderer.domElement.style['vertical-align'] = 'bottom';
    renderer.domElement.style.position = 'relative';
    container.appendChild(renderer.domElement)

    var ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(5, 3, 4);
    light.position.normalize();
    scene.add(light);

    let surfacemesh;
    canvasShared.meshStore.listen(({ geometry }) => {
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
    });

    previewCamera.lookAt(scene.position);

    canvasShared.cameraPositionStore.listen(position => {
      previewCamera.position.set(position[0], position[1], position[2]).multiplyScalar(0.2);
    });

    function render() {
      previewCamera.lookAt(scene.position);
      renderer.render(scene, previewCamera);
    }

    this.onWindowResize = () => {
      previewCamera.left = container.offsetWidth / - 2;
      previewCamera.right = container.offsetWidth / 2;
      previewCamera.top = container.offsetHeight / 2;
      previewCamera.bottom = container.offsetHeight / - 2;
      previewCamera.updateProjectionMatrix();

      renderer.setSize(container.offsetWidth, container.offsetHeight);
    }

    // Add event handlers
    window.addEventListener('resize', this.onWindowResize, false);

    const animate = () => {
      this.frameId = requestAnimationFrame( animate );
      render();
    };
    animate();
  }

  resize() {
    this.onWindowResize();
  }

  updateState(nextState: VoxelEditorState) {
  }

  destroy() {
    window.removeEventListener('resize', this.onWindowResize, false);
    cancelAnimationFrame(this.frameId);
    this.renderer.forceContextLoss();
    this.renderer.context = null;
    this.renderer.domElement = null;
  }
}

export default PreviewView;
