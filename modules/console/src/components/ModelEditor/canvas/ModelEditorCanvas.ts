import THREE from 'three';
import * as ndarray from 'ndarray';
const mapValues = require('lodash/mapValues');
const findLastIndex = require('lodash/findLastIndex');
import { createSelector, Selector } from 'reselect';

const cwise = require('cwise');

import ModelEditorTool from './tools/ModelEditorTool';
import createTool from './tools';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/controls/OrbitControls');
}

import { Schema, SchemaType } from '@pasta/helper/lib/diff';
import SimpleComponent from '../../../libs/SimpleComponent';

import { createGeometryFromMesh } from '../../../canvas/utils';
import Canvas from '../../../canvas/Canvas';
import GeometryFactory from '../../../canvas/GeometryFactory';

import { Keyboard } from '../../../keyboard';

import FlippedBoxGeometry from './objects/FlippedBoxGeometry';
import BoundingBoxEdgesHelper from './objects/BoundingBoxEdgesHelper';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../canvas/Constants';

import {
  ToolType,
  DispatchAction,
  ModelEditorState,
  GetEditorState,
  VoxelData,
  Position,
} from '../types';

interface CanvasOptions {
  container: HTMLElement;
  geometryFactory: GeometryFactory;
  camera: THREE.OrthographicCamera;
  keyboard: Keyboard;
  dispatchAction: DispatchAction;
  state: ModelEditorState;
}

const modelVertexShader = require('raw!./shaders/grid.vert');
const modelFragmentShader = require('raw!./shaders/grid.frag');

const gridVertexShader = require('raw!./shaders/grid3.vert');
const gridFragmentShader = require('raw!./shaders/grid3.frag');

const gridVertexShader4 = require('raw!./shaders/grid4.vert');
const gridFragmentShader4 = require('raw!./shaders/grid4.frag');

const fragmentVertexShader = require('raw!./shaders/fragment.vert');
const fragmentFragmentShader = require('raw!./shaders/fragment.frag');

type ComponentProps = VoxelData;

interface ComponentState {
  fragment?: ndarray.Ndarray;
}

interface ComponentTree {
  size: Position;
  model: ndarray.Ndarray;
  selection: ndarray.Ndarray;
  fragment: ndarray.Ndarray;
  fragmentOffset: Position;
}

const subtract = (() => {
  const _subtract = cwise({
    args: ['array', 'array'],
    body: function(a1, a2) {
      if (a2) a1 = 0;
    },
  });

  return function (array1: ndarray.Ndarray, array2: ndarray.Ndarray) {
    _subtract(array1, array2);
  };
})();

const select = (() => {
  const _select = cwise({
    args: ['array', 'array', 'array'],
    body: function(a1, a2, a3) {
      if (a3) a1 = a2;
    },
  });

  return function (array1: ndarray.Ndarray, array2: ndarray.Ndarray, array3: ndarray.Ndarray) {
    _select(array1, array2, array3);
  };
})();

const PLANE_GRID_STEP = 4;

class ModelEditorCanvasComponent extends SimpleComponent<ComponentProps, ComponentState, ComponentTree> {
  private emptyMesh: THREE.Mesh;

  private planeMaterial: THREE.ShaderMaterial;
  plane: THREE.Mesh;

  private modelMaterial: THREE.Material;
  modelMesh: THREE.Mesh;

  private modelGridMaterial: THREE.ShaderMaterial;
  modelGridMesh: THREE.Mesh;

  private selectionMaterial: THREE.ShaderMaterial;
  selectionMesh: THREE.Mesh;
  selectionBoundingBox: BoundingBoxEdgesHelper;

  private fragmentMaterial: THREE.ShaderMaterial;
  fragmentMesh: THREE.Mesh;
  fragmentBoundingBox: BoundingBoxEdgesHelper;

  fragmentedModelSelector: Selector<any, any>;

  private temp1: THREE.Vector3;

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        size: { type: SchemaType.ANY },
        model: { type: SchemaType.ANY },
        selection: { type: SchemaType.ANY },
        fragment: { type: SchemaType.ANY },
        fragmentOffset: { type: SchemaType.ANY },
      },
    };
  }

  constructor(private canvas: ModelEditorCanvas) {
    super();
    this.state = {
      fragment: null,
    };

    this.temp1 = new THREE.Vector3();

    this.planeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        gridColor: { value: new THREE.Vector3(0.61, 0.61, 0.61) },
        gridThickness: { type: 'f', value: 0.005 },
        scale: {
          value: new THREE.Vector3(
            PIXEL_SCALE * PLANE_GRID_STEP,
            PIXEL_SCALE * PLANE_GRID_STEP,
            PIXEL_SCALE * PLANE_GRID_STEP
          )
        },
      },
      vertexShader: gridVertexShader4,
      fragmentShader: gridFragmentShader4,

      transparent: true,
      depthWrite: false,
    });
    this.planeMaterial.extensions.derivatives = true;

    this.fragmentedModelSelector = createSelector(
      (props: ComponentProps, state: ComponentState) => props.model,
      (props: ComponentProps, state: ComponentState) => state.fragment,
      (model, fragment) => {
        const fragmentedModel = ndarray(model.data.slice(), model.shape);
        subtract(fragmentedModel, this.state.fragment);
        return fragmentedModel;
      }
    );

    this.modelMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,

      polygonOffset: true,
      polygonOffsetFactor: 2, // positive value pushes polygon further away
      polygonOffsetUnits: 1,
    });

    this.modelGridMaterial = new THREE.ShaderMaterial({
      uniforms: {
        gridColor: { value: new THREE.Vector3(1.0, 0.95, 0.46) },
        gridThickness: { type: 'f', value: 0.05 },
      },
      vertexShader: modelVertexShader,
      fragmentShader: modelFragmentShader,
      polygonOffset: true,
      polygonOffsetFactor: 1, // positive value pushes polygon further away
      polygonOffsetUnits: 1,

      transparent: true,
    });
    this.modelGridMaterial.extensions.derivatives = true;

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

    this.fragmentMaterial = new THREE.ShaderMaterial({
      uniforms: {
        opacity: { type: 'f', value: 0.5 },
        gridColor: { value: new THREE.Vector3(0.91, 0.12, 0.39) }, // 0xE91E63
        gridThickness: { type: 'f', value: 0.05 },
      },
      vertexShader: fragmentVertexShader,
      fragmentShader: fragmentFragmentShader,
      transparent: true,
    });
    this.fragmentMaterial.extensions.derivatives = true;

    this.emptyMesh = new THREE.Mesh();
    this.emptyMesh.visible = false;

    this.selectionBoundingBox = new BoundingBoxEdgesHelper(this.emptyMesh, 0xFFEB3B);
    this.selectionBoundingBox.edges.visible = false;
    this.canvas.scene.add(this.selectionBoundingBox.edges);

    this.fragmentBoundingBox = new BoundingBoxEdgesHelper(this.emptyMesh, 0xE91E63);
    this.fragmentBoundingBox.edges.visible = false;
    this.canvas.scene.add(this.fragmentBoundingBox.edges);
  }

  onStart() {
    super.onStart();

    this.plane = this.emptyMesh;
    this.modelMesh = this.emptyMesh;
    this.modelGridMesh = this.emptyMesh;
    this.selectionMesh = this.emptyMesh;
    this.fragmentMesh = this.emptyMesh;
  }

  setTemporaryFragment() {
    if (!this.props.selection) return;

    const { shape } = this.props.model;
    const fragment = ndarray(new Int32Array(shape[0] * shape[1] * shape[2]), this.props.model.shape);
    select(fragment, this.props.model, this.props.selection);

    this.setState({ fragment });
  }

  componentWillReceiveProps(nextProps: ComponentProps) {
    // Reset temporary fragment on every props (file state) update.
    if (this.props !== nextProps) {
      if (this.state.fragment) this.setState({ fragment: null });
    }
  }

  /*
   * This function mutate fragment mesh position without changing
   * component props or state, which is a exception of flux rule. Be careful!
   *
   * Mutation occurred in this function must be reset when props or state changes.
   */
  moveFragmentMesh(displacement: THREE.Vector3) {
    if (!this.fragmentMesh.visible) return;

    this.fragmentMesh.position
      .copy(displacement)
      .multiplyScalar(PIXEL_SCALE);

    this.fragmentBoundingBox.update();
  }

  /*
   * Getting data from view is not a good practice but is allowed here for performance's sake.
   */
  getFragmentPosition(v: THREE.Vector3) {
    v.copy(this.fragmentMesh.position).divideScalar(PIXEL_SCALE).round();
  }

  render() {
    const model = this.state.fragment
      ? this.fragmentedModelSelector(this.props, this.state)
      : this.props.model;

    // Hide selection when temporary fragment exists.
    const selection = this.state.fragment ? null : this.props.selection;

    const fragment = this.state.fragment || this.props.fragment;

    return {
      model,
      selection,
      fragment,
      size: this.props.size,
      fragmentOffset: this.props.fragmentOffset,
    };
  }

  patch(diff: ComponentTree) {
    if (diff.hasOwnProperty('size')) {
      if (this.plane.visible) {
        this.canvas.scene.remove(this.plane);
        this.plane.geometry.dispose();
        this.plane = this.emptyMesh;
      }

      const { size } = this.tree;

      const widthHalf = size[0] / 2;
      const resultX = Math.floor(widthHalf / PLANE_GRID_STEP);
      const offsetX = resultX > 0 ? widthHalf - resultX * PLANE_GRID_STEP : widthHalf;

      const heightHalf = size[1] / 2;
      const resultY = Math.floor(heightHalf / PLANE_GRID_STEP);
      const offsetY = resultY > 0 ? heightHalf - resultY * PLANE_GRID_STEP : heightHalf;

      const depthHalf = size[2] / 2;
      const resultZ = Math.floor(depthHalf / PLANE_GRID_STEP);
      const offsetZ = resultZ > 0 ? depthHalf - resultZ * PLANE_GRID_STEP : depthHalf;

      const geometry = new FlippedBoxGeometry(
        size[0] * PIXEL_SCALE,
        size[1] * PIXEL_SCALE,
        size[2] * PIXEL_SCALE
      );
      geometry.translate(offsetX * PIXEL_SCALE, offsetY * PIXEL_SCALE, offsetZ * PIXEL_SCALE);

      this.plane = new THREE.Mesh(geometry, this.planeMaterial);
      this.plane.position.set(
        widthHalf - offsetX,
        heightHalf - offsetY,
        depthHalf - offsetZ
      ).multiplyScalar(PIXEL_SCALE);
      this.canvas.scene.add(this.plane);

      // Keep direction
      this.temp1.subVectors(this.canvas.camera.position, this.canvas.controls.target);
      this.canvas.updateControlsTarget(size);
      this.canvas.camera.position.addVectors(this.temp1, this.canvas.controls.target);
      this.canvas.controls.update();
    }

    if (diff.hasOwnProperty('model')) {
      if (this.modelMesh.visible) {
        this.canvas.scene.remove(this.modelMesh);
        this.modelMesh.geometry.dispose();
        this.modelMesh = this.emptyMesh;
      }

      if (this.modelGridMesh.visible) {
        this.canvas.scene.remove(this.modelGridMesh);
        this.modelGridMesh.geometry.dispose();
        this.modelGridMesh = this.emptyMesh;
      }

      const geometry = this.canvas.geometryFactory.getGeometry(diff.model);
      if (geometry.vertices.length !== 0) {
        this.modelMesh = new THREE.Mesh(geometry, this.modelMaterial);
        this.modelMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        this.canvas.scene.add(this.modelMesh);

        this.modelGridMesh = new THREE.Mesh(geometry, this.modelGridMaterial);
        this.modelGridMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        this.canvas.scene.add(this.modelGridMesh);
      }
    }

    if (diff.hasOwnProperty('selection')) {
      if (this.selectionMesh.visible) {
        this.canvas.scene.remove(this.selectionMesh);
        this.selectionMesh.geometry.dispose();
        this.selectionMesh = this.emptyMesh;
      }

      if (diff.selection) {
        const geometry = this.canvas.geometryFactory.getGeometry(diff.selection);
        this.selectionMesh = new THREE.Mesh(geometry, this.selectionMaterial);
        this.selectionMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        this.canvas.scene.add(this.selectionMesh);

        this.selectionBoundingBox.edges.visible = true;
        this.selectionBoundingBox.changeTarget(this.selectionMesh);
      } else {
        this.selectionBoundingBox.edges.visible = false;
        this.selectionBoundingBox.changeTarget(this.selectionMesh);
      }
    }

    if (diff.hasOwnProperty('fragment')) {
      if (this.fragmentMesh.visible) {
        this.canvas.scene.remove(this.fragmentMesh);
        this.fragmentMesh.geometry.dispose();
        this.fragmentMesh = this.emptyMesh;
      }

      if (diff.fragment) {
        const geometry = this.canvas.geometryFactory.getGeometry(diff.fragment);
        this.fragmentMesh = new THREE.Mesh(geometry, this.fragmentMaterial);
        this.fragmentMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        this.canvas.scene.add(this.fragmentMesh);

        const offset = this.tree.fragmentOffset;
        this.moveFragmentMesh(this.temp1.set(offset[0], offset[1], offset[2]));

        this.fragmentBoundingBox.edges.visible = true;
        this.fragmentBoundingBox.changeTarget(this.fragmentMesh);
      } else {
        this.fragmentBoundingBox.edges.visible = false;
        this.fragmentBoundingBox.changeTarget(this.fragmentMesh);
      }
    } else if (diff.hasOwnProperty('fragmentOffset')) {
      if (this.tree.fragment) {
        const offset = this.tree.fragmentOffset;
        this.moveFragmentMesh(this.temp1.set(offset[0], offset[1], offset[2]));

        this.fragmentBoundingBox.edges.visible = true;
        this.fragmentBoundingBox.changeTarget(this.fragmentMesh);
      }
    }
  }
}

class ModelEditorCanvas extends Canvas {
  component: ModelEditorCanvasComponent;
  geometryFactory: GeometryFactory;

  controls: any;

  dispatchAction: DispatchAction;

  cachedTools: { [index: string]: ModelEditorTool<any, any, any> };
  tool: ModelEditorTool<any, any, any>;

  camera: THREE.OrthographicCamera;

  // plane: THREE.Mesh;

  private state: ModelEditorState;
  private keyboard: Keyboard;

  private light: THREE.DirectionalLight;

  constructor({
    container,
    geometryFactory,
    dispatchAction,
    state,
    camera,
    keyboard,
  }: CanvasOptions) {
    super(container);

    this.geometryFactory = geometryFactory;

    this.dispatchAction = dispatchAction;
    this.state = state;

    this.camera = camera;
    this.keyboard = keyboard;

    this.cachedTools = {};
  }

  init() {
    super.init();
    this.renderer.setClearColor(0x333333);
    this.renderer.autoClear = false;

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.mouseButtons.ORBIT = THREE.MOUSE.RIGHT;
    this.controls.minZoom = 0.05;
    this.controls.maxZoom = 1;
    this.controls.enableKeys = false;
    this.controls.enablePan = false;

    // Controls emits too many events at the same frame.
    // This is a sort of debouncer.
    let controlsRef = 0;
    const updateControlsState = (() => {
      let controlsHasStarted = false;
      let controlsUpdateTimeout;

      const update = () => {
        if (controlsRef > 0) {
          if (!controlsHasStarted) {
            controlsHasStarted = true;
            this.tool.pause();
          }
        } else {
          if (controlsHasStarted) {
            controlsHasStarted = false;
            this.tool.resume();
          }
        }
      };

      return () => {
        clearTimeout(controlsUpdateTimeout);
        controlsUpdateTimeout = setTimeout(update, 0);
      };
    })();

    this.light = new THREE.DirectionalLight(0xffffff);

    const d = 15 * PIXEL_SCALE;
    this.light.shadow.camera['left'] = - d;
    this.light.shadow.camera['right'] = d;
    this.light.shadow.camera['top'] = d;
    this.light.shadow.camera['bottom'] = - d;
    this.light.shadow.camera['far'] = 2000;
    this.scene.add(this.light);

    // add this only if there is no animation loop (requestAnimationFrame)
    this.controls.addEventListener('change', () => {
      this.syncLightToCamera();
      this.tool.onCameraMove();
      this.render();
    });
    this.controls.addEventListener('start', () => {
      controlsRef++;
      updateControlsState();
    });
    this.controls.addEventListener('end', () => {
      controlsRef--;
      updateControlsState();
    });

    this.tool = this.getTool(this.state.common.selectedTool);
    const props = this.tool.mapParamsToProps(this.state);
    this.tool.start(props);

    this.updateControlsTarget(this.state.file.present.data.size);

    this.controls.update();
    this.syncLightToCamera();

    this.component = new ModelEditorCanvasComponent(this);
    this.component.start(this.state.file.present.data);
    this.render();
  }

  syncLightToCamera() {
    this.light.position.copy(this.camera.position);
    this.light.lookAt(this.controls.target);
  }

  updateCameraOptions() {
    this.camera.left = this.container.clientWidth / - 2;
    this.camera.right = this.container.clientWidth / 2;
    this.camera.top = this.container.clientHeight / 2;
    this.camera.bottom = this.container.clientHeight / - 2;
    this.camera.updateProjectionMatrix();
  }

  initCamera() {
    this.updateCameraOptions();
    return this.camera;
  }

  updateControlsTarget(size: Position) {
    this.controls.target.set(
      size[0] * PIXEL_SCALE_HALF,
      size[1] * PIXEL_SCALE_HALF,
      size[2] * PIXEL_SCALE_HALF
    );
  }

  onChangeCamera(camera: THREE.OrthographicCamera, size: Position) {
    this.camera = camera;
    this.controls.object = this.camera;
    this.updateCameraOptions();
    this.updateControlsTarget(size);
    this.controls.update();
  }

  // Lazy getter
  getTool(toolType: ToolType): ModelEditorTool<any, any, any> {
    const tool = this.cachedTools[toolType];
    if (tool) return tool;

    return this.cachedTools[toolType] =
      createTool(toolType, this, this.dispatchAction, this.keyboard);
  }

  onWindowResize() {
    this.updateCameraOptions();

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.tool.onResize();
    this.render();
  }

  onStateChange(nextState: ModelEditorState) {
    this.component.updateProps(nextState.file.present.data);

    if (this.tool.getToolType() !== nextState.common.selectedTool) {
      const nextTool = this.getTool(nextState.common.selectedTool);
      this.tool.stop();
      this.tool = nextTool;
      const props = this.tool.mapParamsToProps(nextState);
      this.tool.start(props);
    } else {
      const props = this.tool.mapParamsToProps(nextState);
      if (props) this.tool.updateProps(props);
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
