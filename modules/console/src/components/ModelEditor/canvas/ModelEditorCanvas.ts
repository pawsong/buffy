import * as THREE from 'three';
import * as ndarray from 'ndarray';
const mapValues = require('lodash/mapValues');
const findLastIndex = require('lodash/findLastIndex');

import ModelEditorTool from './tools/ModelEditorTool';
import createTool from './tools';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/controls/OrbitControls');
}

import { createGeometryFromMesh } from '../../../canvas/utils';
import Canvas from '../../../canvas/Canvas';

import {
  PIXEL_SCALE,
  DESIGN_IMG_SIZE,
} from '../../../canvas/Constants';

import {
  rgbToHex,
} from './utils';

import {
  ToolType,
  DispatchAction,
  ModelEditorState,
  GetEditorState,
} from '../types';

interface CanvasOptions {
  container: HTMLElement;
  camera: THREE.PerspectiveCamera;
  dispatchAction: DispatchAction;
  state: ModelEditorState;
}

const gridVertexShader = require('raw!./shaders/grid3.vert');
const gridFragmentShader = require('raw!./shaders/grid3.frag');

const gridVertexShader4 = require('raw!./shaders/grid4.vert');
const gridFragmentShader4 = require('raw!./shaders/grid4.frag');

class ModelEditorCanvas extends Canvas {
  controls: any;

  dispatchAction: DispatchAction;

  cachedTools: { [index: string]: ModelEditorTool<any> };
  tool: ModelEditorTool<any>;

  camera: THREE.PerspectiveCamera;

  plane: THREE.Mesh;

  modelMesh: THREE.Mesh;
  selectionMesh: THREE.Mesh;
  selectionGeometry: THREE.Geometry;

  private modelMaterial: THREE.MeshLambertMaterial;
  private selectionMaterial: THREE.ShaderMaterial;

  private state: ModelEditorState;

  private modelGeometry: THREE.Geometry;

  constructor({
    container,
    dispatchAction,
    state,
    camera,
  }: CanvasOptions) {
    super(container);

    this.dispatchAction = dispatchAction;
    this.state = state;

    this.camera = camera;

    this.cachedTools = {};
  }

  init() {
    super.init();
    this.renderer.setClearColor(0x333333);
    this.renderer.autoClear = false;

    const planeWidth = DESIGN_IMG_SIZE * PIXEL_SCALE;
    const planeHeight = DESIGN_IMG_SIZE * PIXEL_SCALE;

    // Plane
    {
      const selectionMaterial = new THREE.ShaderMaterial({
        uniforms: {
          gridColor: { value: new THREE.Vector3(0.61, 0.61, 0.61) },
          gridThickness: { type: 'f', value: 0.02 },
          scale: { value: new THREE.Vector3(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE) },
        },
        vertexShader: gridVertexShader4,
        fragmentShader: gridFragmentShader4,

        side: THREE.DoubleSide,
        transparent: true,
      });
      selectionMaterial.extensions.derivatives = true;

      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      geometry.rotateX( - Math.PI / 2 );

      this.plane = new THREE.Mesh(geometry, selectionMaterial);
      this.plane.position.x = planeWidth / 2;
      this.plane.position.y = 0;
      this.plane.position.z = planeWidth / 2;
      this.scene.add(this.plane)
    }

    // Arrows
    {
      const axisHelper = new THREE.AxisHelper(PIXEL_SCALE *  (DESIGN_IMG_SIZE + 1));
      axisHelper.position.set(0, 0, 0);
      this.scene.add(axisHelper);
    }

    this.modelMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,

      polygonOffset: true,
      polygonOffsetFactor: 1, // positive value pushes polygon further away
      polygonOffsetUnits: 1,
    });

    this.selectionMaterial = new THREE.ShaderMaterial({
      uniforms: {
        gridColor: { value: new THREE.Vector3(1.0, 0.95, 0.46) },
        gridThickness: { type: 'f', value: 0.05 },
      },
      vertexShader: gridVertexShader,
      fragmentShader: gridFragmentShader,
      transparent: true,
    });
    this.selectionMaterial.extensions.derivatives = true;

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 4000;
    this.controls.enableKeys = false;
    this.controls.target.set(
      DESIGN_IMG_SIZE * PIXEL_SCALE / 2,
      DESIGN_IMG_SIZE * PIXEL_SCALE / 4,
      DESIGN_IMG_SIZE * PIXEL_SCALE / 2
    );
    // add this only if there is no animation loop (requestAnimationFrame)
    this.controls.addEventListener('change', () => this.render());

    this.tool = this.getTool(this.state.common.selectedTool);
    this.tool.start(this.state);

    // Render
    this.handleMeshChange(this.state.file.present.data.mesh);
    this.handleSelectionMeshChange(this.state.file.present.data.selectionMesh);

    this.controls.update();
    this.render();
  }

  initCamera() {
    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
    this.camera.updateProjectionMatrix();

    return this.camera;
  }

  onChangeCamera(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.controls.object = this.camera;

    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight
    this.camera.updateProjectionMatrix();

    this.controls.update();
    this.render();
  }

  // Lazy getter
  getTool(toolType: ToolType): ModelEditorTool<any> {
    const tool = this.cachedTools[toolType];
    if (tool) return tool;

    return this.cachedTools[toolType] =
      createTool(toolType, this, this.dispatchAction);
  }

  onWindowResize() {
    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    this.render();
  }

  private handleMeshChange(mesh: any) {
    if (this.modelMesh) {
      this.scene.remove(this.modelMesh);

      // Keep modelMesh for raycaster.
      // this.modelMesh = undefined;
    }

    if (this.modelGeometry) {
      this.modelGeometry.dispose();
      this.modelGeometry = null;
    }

    const geometry = createGeometryFromMesh(mesh);
    if (geometry.vertices.length === 0) return;

    this.modelGeometry = geometry;

    // Create mesh
    this.modelMesh = new THREE.Mesh(this.modelGeometry, this.modelMaterial);
    this.modelMesh['doubleSided'] = false;

    this.modelMesh.position.x = 0;
    this.modelMesh.position.y = 0;
    this.modelMesh.position.z = 0;

    this.modelMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);

    this.scene.add(this.modelMesh);

    this.render();
  }

  handleSelectionMeshChange(selectionMesh: any) {
    if (this.selectionMesh) {
      this.scene.remove(this.selectionMesh);
      this.selectionMesh = null;
    }

    if (this.selectionGeometry) {
      this.selectionGeometry.dispose();
      this.selectionGeometry = null;
    }

    if (!selectionMesh) return;

    this.selectionGeometry = createGeometryFromMesh(selectionMesh);

    this.selectionMesh = new THREE.Mesh(this.selectionGeometry, this.selectionMaterial);
    this.selectionMesh['doubleSided'] = false;

    this.selectionMesh.position.x = 0;
    this.selectionMesh.position.y = 0;
    this.selectionMesh.position.z = 0;

    this.selectionMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.scene.add(this.selectionMesh);
  }

  onStateChange(nextState: ModelEditorState) {
    if (this.state.file.present.data.mesh !== nextState.file.present.data.mesh) {
      this.handleMeshChange(nextState.file.present.data.mesh);
    }

    if (this.state.file.present.data.selectionMesh !== nextState.file.present.data.selectionMesh) {
      this.handleSelectionMeshChange(nextState.file.present.data.selectionMesh);
    }

    if (this.tool.getToolType() !== nextState.common.selectedTool) {
      const nextTool = this.getTool(nextState.common.selectedTool);
      this.tool.stop();
      this.tool = nextTool;
      this.tool.start(nextState);
    } else {
      this.tool.updateProps(nextState);
    }

    this.state = nextState;

    this.render();
  }

  render() {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.tool.onRender();
  }

  destroy() {
    // Destroy tools
    Object.keys(this.cachedTools).forEach(toolType => this.cachedTools[toolType].destroy());

    super.destroy();
  }
}

export default ModelEditorCanvas;
