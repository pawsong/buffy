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

interface ComponentProps {
  model: ndarray.Ndarray;
  selection: ndarray.Ndarray;
}

class ModelEditorCanvasComponent extends SimpleComponent<ComponentProps, any, ComponentProps> {
  private modelMaterial: THREE.MeshLambertMaterial;
  modelMesh: THREE.Mesh;
  private emptyModelMesh: THREE.Mesh;
  private modelMeshIsDirty: boolean;

  private selectionMaterial: THREE.ShaderMaterial;
  selectionMesh: THREE.Mesh;

  private emptySelectionMesh: THREE.Mesh;
  selectionBoundingBox: BoundingBoxEdgesHelper;

  constructor(private canvas: ModelEditorCanvas) {
    super();
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

    this.emptySelectionMesh = new THREE.Mesh();
    this.selectionBoundingBox = new BoundingBoxEdgesHelper(this.emptyModelMesh, 0xFFEB3B);
    this.selectionBoundingBox.edges.visible = false;
    this.canvas.scene.add(this.selectionBoundingBox.edges);
  }

  onStart() {
    super.onStart();

    this.emptyModelMesh = new THREE.Mesh();
    this.modelMesh = this.emptyModelMesh;
    this.modelMeshIsDirty = false;
  }

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        model: { type: SchemaType.ANY },
        selection: { type: SchemaType.ANY },
      },
    };
  }

  render() { return this.props; }

  patch(diff: ComponentProps) {
    if (diff.hasOwnProperty('model')) {
      if (this.modelMeshIsDirty) {
        this.modelMeshIsDirty = false;

        this.canvas.scene.remove(this.modelMesh);
        this.modelMesh.geometry.dispose();

        this.modelMesh = this.emptyModelMesh;
      }

      const mesh = mesher(diff.model);
      const geometry = createGeometryFromMesh(mesh);
      if (geometry.vertices.length !== 0) {
        this.modelMeshIsDirty = true;

        this.modelMesh = new THREE.Mesh(geometry, this.modelMaterial);
        this.modelMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        this.canvas.scene.add(this.modelMesh);
      }
    }

    if (diff.hasOwnProperty('selection')) {
      if (this.selectionMesh) {
        this.canvas.scene.remove(this.selectionMesh);
        this.selectionMesh.geometry.dispose();
        this.selectionMesh = null;
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
        this.selectionBoundingBox.changeTarget(this.emptySelectionMesh);
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
    const props = this.tool.mapParamsToProps(this.state);
    this.tool.start(props);

    this.controls.update();

    this.component = new ModelEditorCanvasComponent(this);
    this.component.start({
      model: this.state.file.present.data.matrix,
      selection: this.state.file.present.data.selection,
    });
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
    this.component.updateProps({
      model: nextState.file.present.data.matrix,
      selection: nextState.file.present.data.selection,
    });

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
