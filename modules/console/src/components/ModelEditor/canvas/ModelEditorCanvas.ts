import THREE from 'three';
import * as ndarray from 'ndarray';
const mapValues = require('lodash/mapValues');
const findLastIndex = require('lodash/findLastIndex');
import { createSelector, Selector } from 'reselect';

const cwise = require('cwise');

import ModelEditorTool from './tools/ModelEditorTool';
import createTool from './tools';

import Mode2dTool from './tools/Mode2dTool';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/controls/OrbitControls');
}

const invariant = require('fbjs/lib/invariant');

import getSlice from '../utils/getSlice';

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
  Axis,
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

import SliceCache from './SliceCache';

type ComponentProps = VoxelData;

interface ComponentState {
  fragment?: ndarray.Ndarray;
  mode2d?: {
    axis: Axis;
    position: number;
  }
}

interface ComponentTree {
  size: Position;
  model: ndarray.Ndarray;
  selection: ndarray.Ndarray;
  fragment: ndarray.Ndarray;
  fragmentOffset: Position;
  mode2D?: {
    enabled: boolean;
    axis: Axis;
    position: number;
  }
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

const px = new THREE.Vector3(   1 ,   0  ,   0 );
const py = new THREE.Vector3(   0 ,   1  ,   0 );
const pz = new THREE.Vector3(   0 ,   0  ,   1 );

const nx = new THREE.Vector3( - 1 ,   0  ,   0 );
const ny = new THREE.Vector3(   0 , - 1  ,   0 );
const nz = new THREE.Vector3(   0 ,   0  , - 1 );

// Prevent flickering
const CLIPPING_OFFSET = 1;

class ModelEditorCanvasComponent extends SimpleComponent<ComponentProps, ComponentState, ComponentTree> {
  private emptyMesh: THREE.Mesh;

  private planeMaterial: THREE.ShaderMaterial;
  plane: THREE.Mesh;

  private modelMaterial: THREE.Material;
  private modelSliceMaterial: THREE.Material;
  modelMesh: THREE.Mesh;

  private modelGridMaterial: THREE.ShaderMaterial;
  private modelGridSliceMaterial: THREE.ShaderMaterial;
  modelGridMesh: THREE.Mesh;

  private selectionMaterial: THREE.ShaderMaterial;
  private selectionSliceMaterial: THREE.ShaderMaterial;
  selectionMesh: THREE.Mesh;
  selectionBoundingBox: BoundingBoxEdgesHelper;

  private fragmentMaterial: THREE.ShaderMaterial;
  private fragmentSliceMaterial: THREE.ShaderMaterial;
  fragmentMesh: THREE.Mesh;
  fragmentBoundingBox: BoundingBoxEdgesHelper;

  fragmentedModelSelector: Selector<any, any>;

  private temp1: THREE.Vector3;

  private modelSliceCache: SliceCache;
  private selectionSliceCache: SliceCache;
  private fragmentSliceCache: SliceCache;

  mode2dPlaneMesh: THREE.Mesh;

  mode2DClippingPlane: THREE.Plane;
  model2DSliceMesh: THREE.Mesh;
  modelGrid2DSliceMesh: THREE.Mesh;
  selectionSliceMesh: THREE.Mesh;
  fragmentSliceMesh: THREE.Mesh;

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        size: { type: SchemaType.ANY },
        model: { type: SchemaType.ANY },
        selection: { type: SchemaType.ANY },
        fragment: { type: SchemaType.ANY },
        fragmentOffset: { type: SchemaType.ANY },
        mode2D: {
          type: SchemaType.OBJECT,
          properties: {
            enabled: { type: SchemaType.BOOLEAN },
            axis: { type: SchemaType.NUMBER },
            position: { type: SchemaType.NUMBER },
          },
        }
      },
    };
  }

  constructor(private canvas: ModelEditorCanvas) {
    super();

    this.state = {
      fragment: null,
      mode2d: null,
    };

    this.temp1 = new THREE.Vector3();
    this.mode2DClippingPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);

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

    this.modelSliceMaterial = new THREE.MeshLambertMaterial({
      vertexColors: THREE.VertexColors,
      polygonOffset: true,
      polygonOffsetFactor: 2, // positive value pushes polygon further away
      polygonOffsetUnits: 1,
    });
    this.modelMaterial = this.modelSliceMaterial.clone();
    this.modelMaterial.opacity = 0.4;

    this.modelGridSliceMaterial = new THREE.ShaderMaterial({
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
    this.modelGridSliceMaterial.extensions.derivatives = true;

    this.modelGridMaterial = this.modelGridSliceMaterial.clone();
    this.modelGridMaterial['clipping'] = true;

    this.selectionSliceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        gridColor: { value: new THREE.Vector3(1.0, 0.95, 0.46) },
        gridThickness: { type: 'f', value: 0.05 },
      },
      vertexShader: gridVertexShader,
      fragmentShader: gridFragmentShader,
      transparent: true,
    });
    this.selectionSliceMaterial.extensions.derivatives = true;
    this.selectionMaterial = this.selectionSliceMaterial.clone();
    this.selectionMaterial['clipping'] = true;

    this.fragmentSliceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        opacity: { type: 'f', value: 0.5 },
        gridColor: { value: new THREE.Vector3(0.91, 0.12, 0.39) }, // 0xE91E63
        gridThickness: { type: 'f', value: 0.05 },
      },
      vertexShader: fragmentVertexShader,
      fragmentShader: fragmentFragmentShader,
      transparent: true,
    });
    this.fragmentSliceMaterial.extensions.derivatives = true;
    this.fragmentMaterial = this.fragmentSliceMaterial.clone();
    this.fragmentMaterial['clipping'] = true;

    this.emptyMesh = new THREE.Mesh();
    this.emptyMesh.visible = false;

    this.selectionBoundingBox = new BoundingBoxEdgesHelper(this.emptyMesh, 0xFFEB3B);
    this.selectionBoundingBox.edges.visible = false;

    this.fragmentBoundingBox = new BoundingBoxEdgesHelper(this.emptyMesh, 0xE91E63);
    this.fragmentBoundingBox.edges.visible = false;

    this.modelSliceCache = new SliceCache([
      this.modelSliceMaterial,
      this.modelGridSliceMaterial,
    ]);

    this.selectionSliceCache = new SliceCache([
      this.selectionSliceMaterial,
    ]);

    this.fragmentSliceCache = new SliceCache([
      this.fragmentSliceMaterial,
    ]);

    const mode2DPlaneGeometry = new THREE.PlaneGeometry(PIXEL_SCALE, PIXEL_SCALE);
    const mode2DPlaneMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -0.1, // positive value pushes polygon further away
    })
    this.mode2dPlaneMesh = new THREE.Mesh(mode2DPlaneGeometry, mode2DPlaneMaterial);
    this.mode2dPlaneMesh.renderOrder = -1;
  }

  onStart() {
    super.onStart();

    this.plane = this.emptyMesh;
    this.modelMesh = this.emptyMesh;
    this.modelGridMesh = this.emptyMesh;
    this.selectionMesh = this.emptyMesh;
    this.fragmentMesh = this.emptyMesh;

    this.model2DSliceMesh = this.emptyMesh;
    this.modelGrid2DSliceMesh = this.emptyMesh;
    this.selectionSliceMesh = this.emptyMesh;
    this.fragmentSliceMesh = this.emptyMesh;
  }

  setTemporaryFragment() {
    if (!this.props.selection) return;

    const { shape } = this.props.model;
    const fragment = ndarray(new Int32Array(shape[0] * shape[1] * shape[2]), this.props.model.shape);
    select(fragment, this.props.model, this.props.selection);

    this.setState({ fragment });
  }

  setTemporaryFragmentSlice() {
    if (!this.props.selection) return;

    const { shape } = this.props.model;

    const fragment = ndarray(new Int32Array(shape[0] * shape[1] * shape[2]), shape);

    const modelSlice = getSlice(this.props.mode2D.axis, this.props.mode2D.position, this.props.model);
    const selectionSlice = getSlice(this.props.mode2D.axis, this.props.mode2D.position, this.props.selection);
    const fragmentSlice = getSlice(this.props.mode2D.axis, this.props.mode2D.position, fragment);

    select(fragmentSlice, modelSlice, selectionSlice);
    this.setState({ fragment });
  }

  componentWillReceiveProps(nextProps: ComponentProps) {
    // Reset temporary fragment on every props (file state) update.
    if (this.props !== nextProps) {
      if (this.state.fragment) this.setState({ fragment: null });
      if (this.state.mode2d) this.setState({ mode2d: null });
    }
  }

  /*
   * This function mutate fragment mesh position without changing
   * component props or state, which is a exception of flux rule. Be careful!
   *
   * Mutation occurred in this function must be reset when props or state changes.
   */
  moveFragmentMesh(displacement: THREE.Vector3) {
    if (this.fragmentMesh.visible) {
      this.fragmentMesh.position.copy(displacement).multiplyScalar(PIXEL_SCALE);
      this.fragmentBoundingBox.update();
    }

    if (this.fragmentSliceMesh.visible) {
      this.fragmentSliceMesh.position.copy(displacement);
      switch(this.tree.mode2D.axis) {
        case Axis.X: {
          this.fragmentSliceMesh.position.setX(this.tree.mode2D.position);
          break;
        }
        case Axis.Y: {
          this.fragmentSliceMesh.position.setY(this.tree.mode2D.position);
          break;
        }
        case Axis.Z: {
          this.fragmentSliceMesh.position.setZ(this.tree.mode2D.position);
          break;
        }
      }

      this.fragmentSliceMesh.position.multiplyScalar(PIXEL_SCALE);
    }
  }

  moveMode2dClippingPlane(axis: Axis, position: number) {
    this.updateClippingPlane(axis, position);
    this.setState({ mode2d: { axis, position } });
  }

  updateClippingPlane(axis: Axis, position: number) {
    this.canvas.camera.getWorldDirection(this.temp1);

    // Move clipping plane
    switch(axis) {
      case Axis.X: {
        this.mode2dPlaneMesh.scale.set(this.props.size[1], this.props.size[2], 1);

        this.mode2dPlaneMesh.position.setY(this.props.size[1] / 2 * PIXEL_SCALE);
        this.mode2dPlaneMesh.position.setZ(this.props.size[2] / 2 * PIXEL_SCALE);
        if (this.temp1.x > 0) {
          this.mode2dPlaneMesh.rotation.set(0, - Math.PI / 2, Math.PI / 2);
          this.mode2dPlaneMesh.position.setX((position + 1) * PIXEL_SCALE);
          this.mode2DClippingPlane.set(px, (- position - 1) * PIXEL_SCALE + CLIPPING_OFFSET);
        } else {
          this.mode2dPlaneMesh.rotation.set(0, Math.PI / 2, Math.PI / 2);
          this.mode2dPlaneMesh.position.setX(position * PIXEL_SCALE);
          this.mode2DClippingPlane.set(nx, position * PIXEL_SCALE + CLIPPING_OFFSET);
        }
        break;
      }
      case Axis.Y: {
        this.mode2dPlaneMesh.scale.set(this.props.size[2], this.props.size[0], 1);

        this.mode2dPlaneMesh.position.setZ(this.props.size[2] / 2 * PIXEL_SCALE);
        this.mode2dPlaneMesh.position.setX(this.props.size[0] / 2 * PIXEL_SCALE);
        if (this.temp1.y > 0) {
          this.mode2dPlaneMesh.rotation.set(Math.PI / 2, 0, Math.PI / 2);
          this.mode2dPlaneMesh.position.setY((position + 1) * PIXEL_SCALE);
          this.mode2DClippingPlane.set(py, (- position - 1) * PIXEL_SCALE + CLIPPING_OFFSET);
        } else {
          this.mode2dPlaneMesh.rotation.set(- Math.PI / 2, 0, Math.PI / 2);
          this.mode2dPlaneMesh.position.setY(position * PIXEL_SCALE);
          this.mode2DClippingPlane.set(ny, position * PIXEL_SCALE + CLIPPING_OFFSET);
        }
        break;
      }
      case Axis.Z: {
        this.mode2dPlaneMesh.scale.set(this.props.size[0], this.props.size[1], 1);

        this.mode2dPlaneMesh.position.setX(this.props.size[0] / 2 * PIXEL_SCALE);
        this.mode2dPlaneMesh.position.setY(this.props.size[1] / 2 * PIXEL_SCALE);
        if (this.temp1.z > 0) {
          this.mode2dPlaneMesh.rotation.set(Math.PI, 0, 0);
          this.mode2dPlaneMesh.position.setZ((position + 1) * PIXEL_SCALE);
          this.mode2DClippingPlane.set(pz, (- position - 1) * PIXEL_SCALE + CLIPPING_OFFSET);
        } else {
          this.mode2dPlaneMesh.rotation.set(0, 0, 0);
          this.mode2dPlaneMesh.position.setZ(position * PIXEL_SCALE);
          this.mode2DClippingPlane.set(nz, position * PIXEL_SCALE + CLIPPING_OFFSET);
        }
        break;
      }
    }
  }

  onCameraMove() {
    if (this.tree.mode2D.enabled) {
      this.updateClippingPlane(this.tree.mode2D.axis, this.tree.mode2D.position);
    };
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
      fragmentOffset: this.props.fragmentOffset,
      size: this.props.size,
      mode2D: Object.assign({}, this.props.mode2D, this.state.mode2d),
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

      if (this.tree.mode2D.enabled) {
        this.patchSlices();
        this.updateClippingPlane(this.tree.mode2D.axis, this.tree.mode2D.position);
      }
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
        this.modelMesh.renderOrder = - 3;
        this.canvas.scene.add(this.modelMesh);

        this.modelGridMesh = new THREE.Mesh(geometry, this.modelGridMaterial);
        this.modelGridMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        this.modelGridMesh.renderOrder = - 2;
        this.canvas.scene.add(this.modelGridMesh);
      }

      if (this.tree.mode2D.enabled) this.patchModelSlice();
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
        this.selectionMesh.renderOrder = - 2;
        this.canvas.scene.add(this.selectionMesh);

        this.selectionBoundingBox.edges.visible = true;
        this.selectionBoundingBox.changeTarget(this.selectionMesh);
      } else {
        this.selectionBoundingBox.edges.visible = false;
        this.selectionBoundingBox.changeTarget(this.selectionMesh);
      }

      if (this.tree.mode2D.enabled) this.patchSelectionSlice();
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
        this.fragmentMesh.renderOrder = - 2;
        this.canvas.scene.add(this.fragmentMesh);

        const offset = this.tree.fragmentOffset;
        this.moveFragmentMesh(this.temp1.set(offset[0], offset[1], offset[2]));

        this.fragmentBoundingBox.edges.visible = true;
        this.fragmentBoundingBox.changeTarget(this.fragmentMesh);
      } else {
        this.fragmentBoundingBox.edges.visible = false;
        this.fragmentBoundingBox.changeTarget(this.fragmentMesh);
      }

      if (this.tree.mode2D.enabled) this.patchFragmentSlice();
    } else if (diff.hasOwnProperty('fragmentOffset')) {
      if (this.tree.fragment) {
        const offset = this.tree.fragmentOffset;
        this.moveFragmentMesh(this.temp1.set(offset[0], offset[1], offset[2]));

        this.fragmentBoundingBox.edges.visible = true;
        this.fragmentBoundingBox.changeTarget(this.fragmentMesh);
      }

      if (this.tree.mode2D.enabled) this.patchFragmentSlice();
    }

    if (diff.hasOwnProperty('mode2D')) {
      if (diff.mode2D.hasOwnProperty('enabled')) {
        if (diff.mode2D.enabled) {
          this.canvas.scene.remove(this.selectionBoundingBox.edges);
          this.canvas.scene.remove(this.fragmentBoundingBox.edges);
          this.canvas.scene.add(this.mode2dPlaneMesh);

          this.modelMaterial.transparent = true;

          this.modelMaterial['clippingPlanes'] =
          this.modelGridMaterial['clippingPlanes'] =
          this.selectionMaterial['clippingPlanes'] =
          this.fragmentMaterial['clippingPlanes'] = [ this.mode2DClippingPlane ];

          this.patchSlices();
          this.updateClippingPlane(this.tree.mode2D.axis, this.tree.mode2D.position);
        } else {
          this.canvas.scene.add(this.selectionBoundingBox.edges);
          this.canvas.scene.add(this.fragmentBoundingBox.edges);

          this.removeSlices();
          this.canvas.scene.remove(this.mode2dPlaneMesh);

          this.modelMaterial.transparent = false;

          this.modelMaterial['clippingPlanes'] =
          this.modelGridMaterial['clippingPlanes'] =
          this.selectionMaterial['clippingPlanes'] =
          this.fragmentMaterial['clippingPlanes'] = [];
        }
      } else {
        this.patchSlices();
        this.updateClippingPlane(this.tree.mode2D.axis, this.tree.mode2D.position);
      }
    }
  }

  private removeModelSlice() {
    if (this.model2DSliceMesh.visible) {
      this.canvas.scene.remove(this.model2DSliceMesh);
      this.model2DSliceMesh.geometry.dispose();
      this.model2DSliceMesh = this.emptyMesh;
    }

    if (this.modelGrid2DSliceMesh.visible) {
      this.canvas.scene.remove(this.modelGrid2DSliceMesh);
      this.modelGrid2DSliceMesh.geometry.dispose();
      this.modelGrid2DSliceMesh = this.emptyMesh;
    }
  }

  private removeSelectionSlice() {
    if (this.selectionSliceMesh.visible) {
      this.canvas.scene.remove(this.selectionSliceMesh);
      this.selectionSliceMesh.geometry.dispose();
      this.selectionSliceMesh = this.emptyMesh;
    }
  }

  private removeFragmentSlice() {
    if (this.fragmentSliceMesh.visible) {
      this.canvas.scene.remove(this.fragmentSliceMesh);
      this.fragmentSliceMesh.geometry.dispose();
      this.fragmentSliceMesh = this.emptyMesh;
    }
  }

  private removeSlices() {
    this.removeModelSlice();
    this.removeSelectionSlice();
    this.removeFragmentSlice();
  }

  private patchModelSlice() {
    this.removeModelSlice();

    const { axis, position } = this.tree.mode2D;

    const meshes = this.modelSliceCache.get(this.tree.model, axis, position);
    if (meshes) {
      this.model2DSliceMesh = meshes[0];
      this.canvas.scene.add(this.model2DSliceMesh);

      this.modelGrid2DSliceMesh = meshes[1];
      this.canvas.scene.add(this.modelGrid2DSliceMesh);
    }
  }

  private patchSelectionSlice() {
    this.removeSelectionSlice();

    if (!this.tree.selection) return;

    const { axis, position } = this.tree.mode2D;

    const meshes = this.selectionSliceCache.get(this.tree.selection, axis, position);
    if (meshes) {
      this.selectionSliceMesh = meshes[0];
      this.canvas.scene.add(this.selectionSliceMesh);
    }
  }

  private patchFragmentSlice() {
    this.removeFragmentSlice();

    if (!this.tree.fragment) return;

    const { axis, position } = this.tree.mode2D;

    let slicePosition: number;
    switch(axis) {
      case Axis.X: {
        slicePosition = position - this.tree.fragmentOffset[0];
        this.temp1.set(
          position,
          this.tree.fragmentOffset[1],
          this.tree.fragmentOffset[2]
        );
        break;
      }
      case Axis.Y: {
        slicePosition = position - this.tree.fragmentOffset[1];
        this.temp1.set(
          this.tree.fragmentOffset[0],
          position,
          this.tree.fragmentOffset[2]
        );
        break;
      }
      case Axis.Z: {
        slicePosition = position - this.tree.fragmentOffset[2];
        this.temp1.set(
          this.tree.fragmentOffset[0],
          this.tree.fragmentOffset[1],
          position
        );
        break;
      }
      default: {
        invariant(false, `invalid axis: ${axis}`);
      }
    }

    if (slicePosition >= 0) {
      const meshes = this.fragmentSliceCache.get(this.tree.fragment, axis, slicePosition);
      if (meshes) {
        this.fragmentSliceMesh = meshes[0];
        this.fragmentSliceMesh.position.copy(this.temp1.multiplyScalar(PIXEL_SCALE));
        this.canvas.scene.add(this.fragmentSliceMesh);
      }
    }
  }

  private patchSlices() {
    this.patchModelSlice();
    this.patchSelectionSlice();
    this.patchFragmentSlice();
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

  private Mode2dTool: Mode2dTool;

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
    this.renderer['localClippingEnabled'] = true;
    this.renderer.setClearColor(0x333333);
    this.renderer.autoClear = false;

    console.log(this.renderer);

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
      this.component.onCameraMove();

      if (this.state.file.present.data.mode2D.enabled) {
        this.Mode2dTool.onCameraMove();
      }

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

    this.tool = this.getTool(this.state.common.tool3d);
    const props = this.tool.mapParamsToProps(this.state);
    this.tool.start(props);

    this.updateControlsTarget(this.state.file.present.data.size);

    this.component = new ModelEditorCanvasComponent(this);
    this.component.start(this.state.file.present.data);

    this.controls.update();
    this.syncLightToCamera();

    this.Mode2dTool = new Mode2dTool({
      canvas: this,
      dispatchAction: this.dispatchAction,
      keyboard: this.keyboard,
    });

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

    const currentToolType = this.state.file.present.data.mode2D.enabled
      ? this.state.common.tool2d : this.state.common.tool3d;

    const nextToolType = nextState.file.present.data.mode2D.enabled
      ? nextState.common.tool2d : nextState.common.tool3d;

    if (currentToolType !== nextToolType) {
      const nextTool = this.getTool(nextToolType);
      this.tool.stop();
      this.tool = nextTool;
      const props = this.tool.mapParamsToProps(nextState);
      this.tool.start(props);
    } else {
      const props = this.tool.mapParamsToProps(nextState);
      if (props) this.tool.updateProps(props);
    }

    if (this.state.file.present.data.mode2D.enabled !== nextState.file.present.data.mode2D.enabled) {
      if (nextState.file.present.data.mode2D.enabled) {
        const props = this.Mode2dTool.mapParamsToProps(nextState);
        this.Mode2dTool.start(props);
      } else {
        this.Mode2dTool.stop();
      }
    } else {
      if (this.state.file.present.data.mode2D.enabled) {
        const props = this.Mode2dTool.mapParamsToProps(nextState);
        if (props) this.Mode2dTool.updateProps(props);
      }
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
    this.Mode2dTool.destroy();

    super.destroy();
  }
}

export default ModelEditorCanvas;
