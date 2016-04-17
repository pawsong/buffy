import * as THREE from 'three';
import * as ndarray from 'ndarray';

import vector3ToString from '@pasta/helper/lib/vector3ToString';

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

export default function initPreview(container, canvasShared: CanvasShared) {

  const scene = new THREE.Scene();

  // Arrows
  {
    const axisHelper = new THREE.AxisHelper(BOX_SIZE *  (GRID_SIZE+1));
    scene.add(axisHelper);
  }

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

  const renderer = new THREE.WebGLRenderer({ antialias: true });
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
    previewCamera.position.copy(position as THREE.Vector3).multiplyScalar(0.2);
  });

  function render() {
    previewCamera.lookAt(scene.position);
    renderer.render(scene, previewCamera);
  }

  function onWindowResize() {
    previewCamera.left = container.offsetWidth / - 2;
    previewCamera.right = container.offsetWidth / 2;
    previewCamera.top = container.offsetHeight / 2;
    previewCamera.bottom = container.offsetHeight / - 2;
    previewCamera.updateProjectionMatrix();

    renderer.setSize(container.offsetWidth, container.offsetHeight);
  }

  // Add event handlers
  window.addEventListener('resize', onWindowResize, false);

  let frameId;
  function animate() {
    frameId = requestAnimationFrame( animate );
    render();
  }
  animate();

  return {
    resize() {
      onWindowResize();
    },
    onChange(state: VoxelEditorState) {

    },
    destroy() {
      window.removeEventListener('resize', onWindowResize, false);
      cancelAnimationFrame(frameId);
      renderer.forceContextLoss();
      renderer.context = null;
      renderer.domElement = null;
    },
  };
}
