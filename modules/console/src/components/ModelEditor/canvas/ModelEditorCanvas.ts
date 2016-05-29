import * as THREE from 'three';
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
import mesher from '../../../canvas/meshers/greedy';

import BoundingBoxEdgesHelper from './helpers/BoundingBoxEdgesHelper';

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
  VoxelData,
  Position,
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

const fragmentVertexShader = require('raw!./shaders/fragment.vert');
const fragmentFragmentShader = require('raw!./shaders/fragment.frag');

type ComponentProps = VoxelData;

interface ComponentState {
  fragment?: ndarray.Ndarray;
}

interface ComponentTree {
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

class ModelEditorCanvasComponent extends SimpleComponent<ComponentProps, ComponentState, ComponentTree> {
  private emptyMesh: THREE.Mesh;

  private modelMaterial: THREE.MeshLambertMaterial;
  modelMesh: THREE.Mesh;

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

    this.fragmentedModelSelector = createSelector(
      (props: ComponentProps, state: ComponentState) => props.matrix,
      (props: ComponentProps, state: ComponentState) => state.fragment,
      (model, fragment) => {
        console.log('selector', model, fragment);
        const fragmentedModel = ndarray(model.data.slice(), model.shape);
        subtract(fragmentedModel, this.state.fragment);
        return fragmentedModel;
      }
    );

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

    this.modelMesh = this.emptyMesh;
    this.selectionMesh = this.emptyMesh;
    this.fragmentMesh = this.emptyMesh;
  }

  setTemporaryFragment() {
    if (!this.props.selection) return;

    const { shape } = this.props.matrix;
    const fragment = ndarray(new Int32Array(shape[0] * shape[1] * shape[2]), this.props.matrix.shape);
    select(fragment, this.props.matrix, this.props.selection);

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
      : this.props.matrix;

    // Hide selection when temporary fragment exists.
    const selection = this.state.fragment ? null : this.props.selection;

    const fragment = this.state.fragment || this.props.fragment;

    return {
      model,
      selection,
      fragment,
      fragmentOffset: this.props.fragmentOffset,
    };
  }

  patch(diff: ComponentTree) {
    if (diff.hasOwnProperty('model')) {
      if (this.modelMesh.visible) {
        this.canvas.scene.remove(this.modelMesh);
        this.modelMesh.geometry.dispose();
        this.modelMesh = this.emptyMesh;
      }

      const mesh = mesher(diff.model);
      const geometry = createGeometryFromMesh(mesh);
      if (geometry.vertices.length !== 0) {
        this.modelMesh = new THREE.Mesh(geometry, this.modelMaterial);
        this.modelMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        this.canvas.scene.add(this.modelMesh);
      }
    }

    if (diff.hasOwnProperty('selection')) {
      if (this.selectionMesh.visible) {
        this.canvas.scene.remove(this.selectionMesh);
        this.selectionMesh.geometry.dispose();
        this.selectionMesh = this.emptyMesh;
      }

      if (diff.selection) {
        const mesh = mesher(diff.selection);
        const geometry = createGeometryFromMesh(mesh);
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
        const mesh = mesher(diff.fragment);
        const geometry = createGeometryFromMesh(mesh);
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

  controls: any;

  dispatchAction: DispatchAction;

  cachedTools: { [index: string]: ModelEditorTool<any, any, any> };
  tool: ModelEditorTool<any, any, any>;

  camera: THREE.PerspectiveCamera;

  plane: THREE.Mesh;

  private state: ModelEditorState;

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

    this.tool = this.getTool(this.state.common.selectedTool);
    const props = this.tool.mapParamsToProps(this.state);
    this.tool.start(props);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.mouseButtons.ORBIT = THREE.MOUSE.RIGHT;
    this.controls.maxDistance = 4000;
    this.controls.enableKeys = false;
    this.controls.enablePan = false;
    this.controls.target.set(
      DESIGN_IMG_SIZE * PIXEL_SCALE / 2,
      DESIGN_IMG_SIZE * PIXEL_SCALE / 2,
      DESIGN_IMG_SIZE * PIXEL_SCALE / 2
    );

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

    // add this only if there is no animation loop (requestAnimationFrame)
    this.controls.addEventListener('change', () => this.render());
    this.controls.addEventListener('start', () => {
      controlsRef++;
      updateControlsState();
    });
    this.controls.addEventListener('end', () => {
      controlsRef--;
      updateControlsState();
    });

    this.controls.update();

    this.component = new ModelEditorCanvasComponent(this);
    this.component.start(this.state.file.present.data);
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
  getTool(toolType: ToolType): ModelEditorTool<any, any, any> {
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
