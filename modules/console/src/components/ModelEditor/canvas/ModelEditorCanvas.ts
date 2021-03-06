import { grey200, grey900 } from 'material-ui/styles/colors';
import * as THREE from 'three';
import * as ndarray from 'ndarray';
const mapValues = require('lodash/mapValues');
const findLastIndex = require('lodash/findLastIndex');
import { createSelector, Selector } from 'reselect';

import ModelEditorTool from './tools/ModelEditorTool';
import createTool from './tools';

import getTroveMaterial from './materials/getTroveMaterial';

import ndAny from '../ndops/any';
import ndExclude from '../ndops/exclude';
import ndCopyWithFilter from '../ndops/copyWithFilter';

import Mode2dTool from './tools/Mode2dTool';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/controls/OrbitControls');
}

const invariant = require('fbjs/lib/invariant');

import getSlice from '../utils/getSlice';
import getUniqueToolType from '../utils/getUniqueToolType';

import { Schema, SchemaType } from '@pasta/helper/lib/diff';
import SimpleComponent from '../../../libs/SimpleComponent';

import { createGeometryFromMesh } from '../../../canvas/utils';
import Canvas from '../../../canvas/Canvas';
import GeometryFactory from '../../../canvas/GeometryFactory';
import { OutlineGeometryFactory } from '../../../canvas/GeometryFactory';
import MaskGeometryFactory from '../../../canvas/MaskGeometryFactory';
import TroveGeometryFactory from '../../../canvas/TroveGeometryFactory';

import { Keyboard } from '../../../keyboard';

import FlippedBoxGeometry from './objects/FlippedBoxGeometry';
import BoundingBoxEdgesHelper from './objects/BoundingBoxEdgesHelper';

import mapinfo from '../mapinfo';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../canvas/Constants';

import {
  ToolType,
  DispatchAction,
  ModelEditorState,
  CommonState,
  GetEditorState,
  VoxelData,
  Position,
  Axis,
  MaterialMaps,
  Color,
} from '../types';

import {
  MaterialMapType,
} from '../../../types';

interface CanvasOptions {
  container: HTMLElement;
  geometryFactory: GeometryFactory;
  troveGeometryFactory: TroveGeometryFactory;
  cameraO: THREE.OrthographicCamera;
  cameraP: THREE.PerspectiveCamera;
  keyboard: Keyboard;
  dispatchAction: DispatchAction;
  state: ModelEditorState;
  onTemporarySizeUpdate: (size: Position) => any;
}

const modelVertexShader = require('raw!./shaders/grid.vert');
const modelFragmentShader = require('raw!./shaders/grid.frag');

const gridVertexShader = require('raw!./shaders/grid3.vert');
const gridFragmentShader = require('raw!./shaders/grid3.frag');

const gridVertexShader4 = require('raw!./shaders/grid4.vert');
const gridFragmentShader4 = require('raw!./shaders/grid4.frag');

import SliceCache from './SliceCache';
import MaskSliceCache from './MaskSliceCache';
import OutlineSliceCache from './OutlineSliceCache';
import TroveSliceCache from './TroveSliceCache';

interface ComponentProps {
  model: VoxelData;
  common: CommonState;
}

interface ComponentState {
  fragment?: MaterialMaps;
  mode2d?: {
    axis: Axis;
    position: number;
  }
}

interface ComponentTree {
  activeMap: MaterialMapType;
  maps: MaterialMaps;
  size: Position;
  model: ndarray.Ndarray;
  selection: ndarray.Ndarray;
  fragment: MaterialMaps;
  fragmentOffset: Position;
  mode2d?: {
    enabled: boolean;
    axis: Axis;
    position: number;
  }
  showWireframe: boolean;
  backgroundColor: Color;
}

const PLANE_GRID_STEP = 4;

const px = new THREE.Vector3(   1 ,   0  ,   0 );
const py = new THREE.Vector3(   0 ,   1  ,   0 );
const pz = new THREE.Vector3(   0 ,   0  ,   1 );

const nx = new THREE.Vector3( - 1 ,   0  ,   0 );
const ny = new THREE.Vector3(   0 , - 1  ,   0 );
const nz = new THREE.Vector3(   0 ,   0  , - 1 );

const units = [px, nx, py, ny, pz, nz];
const rotations = [
  new THREE.Euler(  0           , - Math.PI / 2 , Math.PI / 2),
  new THREE.Euler(  0           ,   Math.PI / 2 , Math.PI / 2),
  new THREE.Euler(  Math.PI / 2 ,   0           , Math.PI / 2),
  new THREE.Euler(- Math.PI / 2 ,   0           , Math.PI / 2),
  new THREE.Euler(  Math.PI     ,   0           , 0          ),
  new THREE.Euler(  0           ,   0           , 0          ),
];

// Prevent flickering
const CLIPPING_OFFSET = 1;

const VIEW_CUBE_SIZE = 70;

function isBright(r: number, g: number, b: number) {
  return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
}

class ModelEditorCanvasComponent extends SimpleComponent<ComponentProps, ComponentState, ComponentTree> {
  private emptyMesh: THREE.Mesh;

  private planeMaterial: THREE.ShaderMaterial;
  plane: THREE.Mesh;

  private modelMultiMaterial: THREE.MultiMaterial;
  private modelSliceMultiMaterial: THREE.MultiMaterial;

  private modelMaterial: THREE.Material;
  private modelSliceMaterial: THREE.Material;
  modelMesh: THREE.Mesh;
  model2DSliceMesh: THREE.Mesh;

  private modelGridMaterial: THREE.ShaderMaterial;
  private modelGridSliceMaterial: THREE.ShaderMaterial;
  modelGridMesh: THREE.Mesh;
  modelGrid2DSliceMesh: THREE.Mesh;

  private selectionMaterial: THREE.ShaderMaterial;
  private selectionSliceMaterial: THREE.ShaderMaterial;
  selectionMesh: THREE.Mesh;
  selectionSliceMesh: THREE.Mesh;
  selectionBoundingBox: BoundingBoxEdgesHelper;

  fragmentMesh: THREE.Mesh;
  fragmentSliceMesh: THREE.Mesh;
  fragmentBoundingBox: BoundingBoxEdgesHelper;

  private fragmentGridMaterial: THREE.ShaderMaterial;
  private fragmentGridSliceMaterial: THREE.ShaderMaterial;
  fragmentGridMesh: THREE.Mesh;
  fragmentGridSliceMesh: THREE.Mesh;

  fragmentedModelSelector: Selector<any, any>;
  fragmentedSelectionSelector: Selector<any, any>;

  private temp1: THREE.Vector3;

  private modelSliceCache: SliceCache;
  private typeMaskSliceCache: MaskSliceCache;
  private alphaMaskSliceCache: MaskSliceCache;
  private specularMaskSliceCache: MaskSliceCache;
  private troveSliceCache: TroveSliceCache;

  private selectionSliceCache: SliceCache;

  private fragmentSliceCache: SliceCache;
  private fragmentTypeMaskSliceCache: MaskSliceCache;
  private fragmentAlphaMaskSliceCache: MaskSliceCache;
  private fragmentSpecularMaskSliceCache: MaskSliceCache;
  private fragmentTroveSliceCache: TroveSliceCache;
  private fragmentGridSliceCache: OutlineSliceCache;

  outlineGeometryFactory: OutlineGeometryFactory;

  typeMaskGeometryFactory: MaskGeometryFactory;
  alphaMaskGeometryFactory: MaskGeometryFactory;
  specularMaskGeometryFactory: MaskGeometryFactory;

  mode2dPlaneMesh: THREE.Mesh;

  mode2dClippingPlane: THREE.Plane;

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        activeMap: { type: SchemaType.ANY },
        maps: {
          type: SchemaType.MAP,
          items: { type: SchemaType.ANY },
        },
        size: { type: SchemaType.ANY },
        model: { type: SchemaType.ANY },
        selection: { type: SchemaType.ANY },
        fragment: { type: SchemaType.ANY },
        fragmentOffset: { type: SchemaType.ANY },
        mode2d: {
          type: SchemaType.OBJECT,
          properties: {
            enabled: { type: SchemaType.BOOLEAN },
            axis: { type: SchemaType.NUMBER },
            position: { type: SchemaType.NUMBER },
          },
        },
        showWireframe: { type: SchemaType.ANY },
        backgroundColor: { type: SchemaType.ANY },
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
    this.mode2dClippingPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);

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
      (props: ComponentProps, state: ComponentState) => props.model.maps[MaterialMapType.DEFAULT],
      (props: ComponentProps, state: ComponentState) => state.fragment[MaterialMapType.DEFAULT],
      (model, fragment) => {
        const fragmentedModel = ndarray(model.data.slice(), model.shape);
        ndExclude(fragmentedModel, fragment);
        return fragmentedModel;
      }
    );

    this.fragmentedSelectionSelector = createSelector(
      (props: ComponentProps, state: ComponentState) => props.model.selection,
      (props: ComponentProps, state: ComponentState) => state.fragment[MaterialMapType.DEFAULT],
      (selection, fragment) => {
        const fragmentedSelection = ndarray(selection.data.slice(), selection.shape);
        ndExclude(fragmentedSelection, fragment);
        return ndAny(fragmentedSelection) ? fragmentedSelection : null;
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

    this.outlineGeometryFactory = new OutlineGeometryFactory();

    this.typeMaskGeometryFactory = new MaskGeometryFactory(mapinfo[MaterialMapType.TROVE_TYPE].defaultColor);
    this.alphaMaskGeometryFactory = new MaskGeometryFactory(mapinfo[MaterialMapType.TROVE_ALPHA].defaultColor);
    this.specularMaskGeometryFactory = new MaskGeometryFactory(mapinfo[MaterialMapType.TROVE_SPECULAR].defaultColor);

    this.modelSliceMultiMaterial = getTroveMaterial(true);
    this.modelSliceMultiMaterial.materials.forEach(material => material['clipping'] = true);

    this.modelMultiMaterial = this.modelSliceMultiMaterial.clone();

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

    this.fragmentGridMaterial = this.selectionMaterial.clone();
    this.fragmentGridMaterial.uniforms.gridColor = { value: new THREE.Vector3(0.91, 0.12, 0.39) }, // 0xE91E63
    this.fragmentGridSliceMaterial = this.selectionSliceMaterial.clone();
    this.fragmentGridSliceMaterial.uniforms.gridColor = { value: new THREE.Vector3(0.91, 0.12, 0.39) }, // 0xE91E63

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
      this.modelSliceMaterial,
    ]);

    this.fragmentTypeMaskSliceCache = new MaskSliceCache([
      this.modelSliceMaterial,
    ], mapinfo[MaterialMapType.TROVE_TYPE].defaultColor);
    this.fragmentAlphaMaskSliceCache = new MaskSliceCache([
      this.modelSliceMaterial,
    ], mapinfo[MaterialMapType.TROVE_ALPHA].defaultColor);
    this.fragmentSpecularMaskSliceCache = new MaskSliceCache([
      this.modelSliceMaterial,
    ], mapinfo[MaterialMapType.TROVE_SPECULAR].defaultColor);
    this.fragmentTroveSliceCache = new TroveSliceCache([
      this.modelSliceMultiMaterial,
    ]);

    this.fragmentGridSliceCache = new OutlineSliceCache([
      this.fragmentGridSliceMaterial,
    ]);

    this.typeMaskSliceCache = new MaskSliceCache([
      this.modelSliceMaterial,
      this.modelGridSliceMaterial,
    ], mapinfo[MaterialMapType.TROVE_TYPE].defaultColor);
    this.alphaMaskSliceCache = new MaskSliceCache([
      this.modelSliceMaterial,
      this.modelGridSliceMaterial,
    ], mapinfo[MaterialMapType.TROVE_ALPHA].defaultColor);
    this.specularMaskSliceCache = new MaskSliceCache([
      this.modelSliceMaterial,
      this.modelGridSliceMaterial,
    ], mapinfo[MaterialMapType.TROVE_SPECULAR].defaultColor);
    this.troveSliceCache = new TroveSliceCache([
      this.modelSliceMultiMaterial,
    ]);

    const mode2dPlaneGeometry = new THREE.PlaneGeometry(PIXEL_SCALE, PIXEL_SCALE);
    const mode2dPlaneMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -0.1, // positive value pushes polygon further away
    })
    this.mode2dPlaneMesh = new THREE.Mesh(mode2dPlaneGeometry, mode2dPlaneMaterial);
    this.mode2dPlaneMesh.renderOrder = -1;
  }

  onStart() {
    super.onStart();

    this.plane = this.emptyMesh;

    this.modelMesh = this.emptyMesh;
    this.model2DSliceMesh = this.emptyMesh;

    this.modelGridMesh = this.emptyMesh;
    this.modelGrid2DSliceMesh = this.emptyMesh;

    this.selectionMesh = this.emptyMesh;
    this.selectionSliceMesh = this.emptyMesh;

    this.fragmentMesh = this.emptyMesh;
    this.fragmentSliceMesh = this.emptyMesh;

    this.fragmentGridMesh = this.emptyMesh;
    this.fragmentGridSliceMesh = this.emptyMesh;
  }

  setTemporaryFragment() {
    if (!this.props.model.selection) return;

    const shape = this.props.model.size;
    const fragment = <MaterialMaps>{};

    Object.keys(this.props.model.maps).forEach(key => {
      const result = ndarray(new Int32Array(shape[0] * shape[1] * shape[2]), shape);
      ndCopyWithFilter(result, this.props.model.maps[key], this.props.model.selection);
      fragment[key] = result;
    });

    this.setState({ fragment });
  }

  setTemporaryFragmentSlice() {
    if (!this.props.model.selection) return;

    const shape = this.props.model.size;
    const fragment = <MaterialMaps>{};

    const { mode2d } = this.props.model;

    const selectionSlice = getSlice(mode2d.axis, mode2d.position, this.props.model.selection);

    Object.keys(this.props.model.maps).forEach(key => {
      const result = ndarray(new Int32Array(shape[0] * shape[1] * shape[2]), shape);

      const modelSlice = getSlice(mode2d.axis, mode2d.position, this.props.model.maps[key]);
      const fragmentSlice = getSlice(mode2d.axis, mode2d.position, result);

      ndCopyWithFilter(fragmentSlice, modelSlice, selectionSlice);
      fragment[key] = result;
    });

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

    if (this.fragmentGridMesh.visible) {
      this.fragmentGridMesh.position.copy(displacement).multiplyScalar(PIXEL_SCALE);
    }
  }

  moveFragmentSliceMesh(displacement: THREE.Vector3) {
    if (this.fragmentSliceMesh.visible) {
      this.fragmentSliceMesh.position
        .copy(displacement)
        .setComponent(this.tree.mode2d.axis, this.tree.mode2d.position);
      this.fragmentSliceMesh.position.multiplyScalar(PIXEL_SCALE);
    }

    if (this.fragmentGridSliceMesh.visible) {
      this.fragmentGridSliceMesh.position
        .copy(displacement)
        .setComponent(this.tree.mode2d.axis, this.tree.mode2d.position);
      this.fragmentGridSliceMesh.position.multiplyScalar(PIXEL_SCALE);
    }
  }

  moveMode2dClippingPlane(axis: Axis, position: number) {
    this.updateClippingPlane(axis, position);

    if (!this.state.mode2d || this.state.mode2d.axis !== axis || this.state.mode2d.position !== position) {
      this.setState({ mode2d: { axis, position } });
    }
  }

  updateClippingPlane(axis: Axis, position: number) {
    this.canvas.camera.getWorldDirection(this.temp1);

    const u = (axis + 1) % 3;
    const v = (axis + 2) % 3;

    this.mode2dPlaneMesh.scale.set(this.props.model.size[u], this.props.model.size[v], 1);
    this.mode2dPlaneMesh.position.setComponent(u, this.props.model.size[u] / 2 * PIXEL_SCALE);
    this.mode2dPlaneMesh.position.setComponent(v, this.props.model.size[v] / 2 * PIXEL_SCALE);

    if (this.temp1.getComponent(axis) > 0) {
      const i = 2 * axis;
      this.mode2dPlaneMesh.rotation.copy(rotations[i]);
      this.mode2dPlaneMesh.position.setComponent(axis, (position + 1) * PIXEL_SCALE);
      this.mode2dClippingPlane.set(units[i], (- position - 1) * PIXEL_SCALE + CLIPPING_OFFSET);
    } else {
      const i = 2 * axis + 1;
      this.mode2dPlaneMesh.rotation.copy(rotations[i]);
      this.mode2dPlaneMesh.position.setComponent(axis, position * PIXEL_SCALE);
      this.mode2dClippingPlane.set(units[i], position * PIXEL_SCALE + CLIPPING_OFFSET);
    }
  }

  onCameraMove() {
    if (this.tree.mode2d.enabled) {
      this.updateClippingPlane(this.tree.mode2d.axis, this.tree.mode2d.position);
    };
  }

  /*
   * Getting data from view is not a good practice but is allowed here for performance's sake.
   */
  getFragmentPosition(v: THREE.Vector3) {
    v.copy(this.fragmentMesh.position).divideScalar(PIXEL_SCALE).round();
  }

  getFragmentSlicePosition(v: THREE.Vector3) {
    v.copy(this.fragmentSliceMesh.position).divideScalar(PIXEL_SCALE).round();
  }

  render() {
    const model = this.state.fragment
      ? this.fragmentedModelSelector(this.props, this.state)
      : this.props.model.maps[MaterialMapType.DEFAULT];

    // Hide selection when temporary fragment exists.
    const selection = this.state.fragment && this.props.model.selection
      ? this.fragmentedSelectionSelector(this.props, this.state)
      : this.props.model.selection;

    const fragment = this.state.fragment || this.props.model.fragment;

    return {
      activeMap: this.props.model.activeMap,
      maps: this.props.model.maps,
      model,
      selection,
      fragment,
      fragmentOffset: this.props.model.fragmentOffset,
      size: this.props.model.size,
      mode2d: Object.assign({}, this.props.model.mode2d, this.state.mode2d),
      showWireframe: this.props.common.showWireframe,
      backgroundColor: this.props.common.backgroundColor,
    };
  }

  patch(diff: ComponentTree) {
    if (diff.hasOwnProperty('backgroundColor')) {
      const color = this.tree.backgroundColor;
      const bright = isBright(color.r, color.g, color.b);
      const c = bright ? 0x33 / 0xff : 1;
      this.planeMaterial.uniforms.gridColor.value.set(c, c, c);
    }

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

      if (this.tree.mode2d.enabled) {
        this.patchSlices();
        this.updateClippingPlane(this.tree.mode2d.axis, this.tree.mode2d.position);
      }
    }

    if (
         diff.hasOwnProperty('model')
      || diff.hasOwnProperty('activeMap')
      || (diff.maps && (this.tree.activeMap === MaterialMapType.ALL || diff.maps.hasOwnProperty(this.tree.activeMap)))
      || diff.hasOwnProperty('showWireframe')
    ) {
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

      let geometry: THREE.Geometry;

      switch(this.tree.activeMap) {
        case MaterialMapType.DEFAULT: {
          geometry = this.canvas.geometryFactory.getGeometry(this.tree.model);
          break;
        }
        case MaterialMapType.ALL: {
          // TODO: Use MultiMaterial
          geometry = this.canvas.troveGeometryFactory.getGeometry(
            this.tree.model,
            this.tree.maps[MaterialMapType.TROVE_TYPE],
            this.tree.maps[MaterialMapType.TROVE_ALPHA],
            this.tree.maps[MaterialMapType.TROVE_SPECULAR]
          );
          break;
        }
        case MaterialMapType.TROVE_TYPE: {
          geometry = this.typeMaskGeometryFactory.getGeometry(
            this.tree.maps[MaterialMapType.TROVE_TYPE], this.tree.model
          );
          break;
        }
        case MaterialMapType.TROVE_ALPHA: {
          geometry = this.alphaMaskGeometryFactory.getGeometry(
            this.tree.maps[MaterialMapType.TROVE_ALPHA], this.tree.model
          );
          break;
        }
        case MaterialMapType.TROVE_SPECULAR: {
          geometry = this.specularMaskGeometryFactory.getGeometry(
            this.tree.maps[MaterialMapType.TROVE_SPECULAR], this.tree.model
          );
          break;
        }
      }

      if (geometry && geometry.vertices.length !== 0) {
        this.modelMesh = new THREE.Mesh(geometry,
          this.tree.activeMap === MaterialMapType.ALL ? this.modelMultiMaterial : this.modelMaterial
        );
        this.modelMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        this.modelMesh.renderOrder = - 3;
        this.canvas.scene.add(this.modelMesh);

        if (this.tree.showWireframe && this.tree.activeMap !== MaterialMapType.ALL) {
          this.modelGridMesh = new THREE.Mesh(geometry, this.modelGridMaterial);
          this.modelGridMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
          this.modelGridMesh.renderOrder = - 2;
          this.canvas.scene.add(this.modelGridMesh);
        }
      }

      if (this.tree.mode2d.enabled) this.patchModelSlice();
    }

    if (diff.hasOwnProperty('selection')) {
      if (this.selectionMesh.visible) {
        this.canvas.scene.remove(this.selectionMesh);
        this.selectionMesh.geometry.dispose();
        this.selectionMesh = this.emptyMesh;
      }

      if (this.tree.selection) {
        const geometry = this.canvas.geometryFactory.getGeometry(this.tree.selection);
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

      if (this.tree.mode2d.enabled) this.patchSelectionSlice();
    }

    if (
         diff.hasOwnProperty('fragment')
      || diff.hasOwnProperty('activeMap')
    ) {

      if (this.fragmentMesh.visible) {
        this.canvas.scene.remove(this.fragmentMesh);
        this.fragmentMesh.geometry.dispose();
        this.fragmentMesh = this.emptyMesh;
      }

      if (this.fragmentGridMesh.visible) {
        this.canvas.scene.remove(this.fragmentGridMesh);
        this.fragmentGridMesh.geometry.dispose();
        this.fragmentGridMesh = this.emptyMesh;
      }

      if (this.tree.fragment) {
        let geometry: THREE.Geometry;

        switch(this.tree.activeMap) {
          case MaterialMapType.DEFAULT: {
            geometry = this.canvas.geometryFactory.getGeometry(
              this.tree.fragment[MaterialMapType.DEFAULT]
            );
            break;
          }
          case MaterialMapType.ALL: {
            // TODO: Use MultiMaterial
            geometry = this.canvas.troveGeometryFactory.getGeometry(
              this.tree.fragment[MaterialMapType.DEFAULT],
              this.tree.fragment[MaterialMapType.TROVE_TYPE],
              this.tree.fragment[MaterialMapType.TROVE_ALPHA],
              this.tree.fragment[MaterialMapType.TROVE_SPECULAR]
            );
            break;
          }
          case MaterialMapType.TROVE_TYPE: {
            geometry = this.typeMaskGeometryFactory.getGeometry(
              this.tree.fragment[MaterialMapType.TROVE_TYPE], this.tree.fragment[MaterialMapType.DEFAULT]
            );
            break;
          }
          case MaterialMapType.TROVE_ALPHA: {
            geometry = this.alphaMaskGeometryFactory.getGeometry(
              this.tree.fragment[MaterialMapType.TROVE_ALPHA], this.tree.fragment[MaterialMapType.DEFAULT]
            );
            break;
          }
          case MaterialMapType.TROVE_SPECULAR: {
            geometry = this.specularMaskGeometryFactory.getGeometry(
              this.tree.fragment[MaterialMapType.TROVE_SPECULAR], this.tree.fragment[MaterialMapType.DEFAULT]
            );
            break;
          }
        }

        this.fragmentMesh = new THREE.Mesh(geometry,
          this.tree.activeMap === MaterialMapType.ALL ? this.modelMultiMaterial : this.modelMaterial
        );
        this.fragmentMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        this.fragmentMesh.renderOrder = - 2;
        this.canvas.scene.add(this.fragmentMesh);

        const outlineGeometry = this.outlineGeometryFactory.getGeometry(this.tree.fragment[MaterialMapType.DEFAULT]);
        this.fragmentGridMesh = new THREE.Mesh(outlineGeometry, this.fragmentGridMaterial);
        this.fragmentGridMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        this.fragmentGridMesh.renderOrder = - 2;
        this.canvas.scene.add(this.fragmentGridMesh);

        const offset = this.tree.fragmentOffset;
        this.moveFragmentMesh(this.temp1.set(offset[0], offset[1], offset[2]));

        this.fragmentBoundingBox.edges.visible = true;
        this.fragmentBoundingBox.changeTarget(this.fragmentMesh);
      } else {
        this.fragmentBoundingBox.edges.visible = false;
        this.fragmentBoundingBox.changeTarget(this.fragmentMesh);
      }

      if (this.tree.mode2d.enabled) this.patchFragmentSlice();
    } else if (diff.hasOwnProperty('fragmentOffset')) {
      if (this.tree.fragment) {
        const offset = this.tree.fragmentOffset;
        this.moveFragmentMesh(this.temp1.set(offset[0], offset[1], offset[2]));

        this.fragmentBoundingBox.edges.visible = true;
        this.fragmentBoundingBox.changeTarget(this.fragmentMesh);
      }

      if (this.tree.mode2d.enabled) this.patchFragmentSlice();
    }

    if (diff.hasOwnProperty('mode2d')) {
      if (diff.mode2d.hasOwnProperty('enabled')) {
        if (this.tree.mode2d.enabled) {
          this.canvas.boundingBoxScene.remove(this.selectionBoundingBox.edges);
          this.canvas.boundingBoxScene.remove(this.fragmentBoundingBox.edges);
          this.canvas.scene.add(this.mode2dPlaneMesh);

          this.modelMaterial.transparent = true;

          const clippingPlanes = [this.mode2dClippingPlane];

          this.modelMaterial.clippingPlanes =
          this.modelGridMaterial.clippingPlanes =
          this.selectionMaterial.clippingPlanes =
          this.fragmentGridMaterial.clippingPlanes = clippingPlanes;

          this.modelMultiMaterial.materials.forEach(material => material.clippingPlanes = clippingPlanes);

          // Force update until https://github.com/mrdoob/three.js/pull/9585 is merged
          [
            this.modelMaterial,
            this.modelGridMaterial,
            this.selectionMaterial,
            this.fragmentGridMaterial,
          ].concat(this.modelMultiMaterial.materials).forEach(material => material.needsUpdate = true);

          this.patchSlices();
          this.updateClippingPlane(this.tree.mode2d.axis, this.tree.mode2d.position);
        } else {
          this.canvas.boundingBoxScene.add(this.selectionBoundingBox.edges);
          this.canvas.boundingBoxScene.add(this.fragmentBoundingBox.edges);

          this.removeSlices();
          this.canvas.scene.remove(this.mode2dPlaneMesh);

          this.modelMaterial.transparent = false;

          this.modelMaterial.clippingPlanes =
          this.modelGridMaterial.clippingPlanes =
          this.selectionMaterial.clippingPlanes =
          this.fragmentGridMaterial.clippingPlanes = [];

          this.modelMultiMaterial.materials.forEach(material => material.clippingPlanes = []);

          // Force update until https://github.com/mrdoob/three.js/pull/9585 is merged
          [
            this.modelMaterial,
            this.modelGridMaterial,
            this.selectionMaterial,
            this.fragmentGridMaterial,
          ].concat(this.modelMultiMaterial.materials).forEach(material => material.needsUpdate = true);
        }
      } else {
        this.patchSlices();
        this.updateClippingPlane(this.tree.mode2d.axis, this.tree.mode2d.position);
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

    if (this.fragmentGridSliceMesh.visible) {
      this.canvas.scene.remove(this.fragmentGridSliceMesh);
      this.fragmentGridSliceMesh.geometry.dispose();
      this.fragmentGridSliceMesh = this.emptyMesh;
    }
  }

  private removeSlices() {
    this.removeModelSlice();
    this.removeSelectionSlice();
    this.removeFragmentSlice();
  }

  private patchModelSlice() {
    this.removeModelSlice();

    const { axis, position } = this.tree.mode2d;

    let meshes: THREE.Mesh[];

    switch(this.tree.activeMap) {
      case MaterialMapType.DEFAULT: {
        meshes = this.modelSliceCache.get(this.tree.model, axis, position);
        break;
      }
      case MaterialMapType.ALL: {
        meshes = this.troveSliceCache.get(
          this.tree.model,
          this.tree.maps[MaterialMapType.TROVE_TYPE],
          this.tree.maps[MaterialMapType.TROVE_ALPHA],
          this.tree.maps[MaterialMapType.TROVE_SPECULAR],
          axis, position
        );
        break;
      }
      case MaterialMapType.TROVE_TYPE: {
        meshes = this.typeMaskSliceCache.get(
          this.tree.maps[MaterialMapType.TROVE_TYPE], this.tree.model, axis, position
        );
        break;
      }
      case MaterialMapType.TROVE_ALPHA: {
        meshes = this.alphaMaskSliceCache.get(
          this.tree.maps[MaterialMapType.TROVE_ALPHA], this.tree.model, axis, position
        );
        break;
      }
      case MaterialMapType.TROVE_SPECULAR: {
        meshes = this.specularMaskSliceCache.get(
          this.tree.maps[MaterialMapType.TROVE_SPECULAR], this.tree.model, axis, position
        );
        break;
      }
    }

    if (meshes) {
      this.model2DSliceMesh = meshes[0];
      this.canvas.scene.add(this.model2DSliceMesh);

      if (this.tree.showWireframe && meshes[1] && this.tree.activeMap !== MaterialMapType.ALL) {
        this.modelGrid2DSliceMesh = meshes[1];
        this.canvas.scene.add(this.modelGrid2DSliceMesh);
      }
    }
  }

  private patchSelectionSlice() {
    this.removeSelectionSlice();

    if (!this.tree.selection) return;

    const { axis, position } = this.tree.mode2d;

    const meshes = this.selectionSliceCache.get(this.tree.selection, axis, position);
    if (meshes) {
      this.selectionSliceMesh = meshes[0];
      this.canvas.scene.add(this.selectionSliceMesh);
    }
  }

  private patchFragmentSlice() {
    this.removeFragmentSlice();

    if (!this.tree.fragment) return;

    const { axis, position } = this.tree.mode2d;

    const slicePosition = position - this.tree.fragmentOffset[axis];
    if (slicePosition >= 0 && slicePosition < this.tree.fragment[MaterialMapType.DEFAULT].shape[axis]) {
      let meshes: THREE.Mesh[];

      switch(this.tree.activeMap) {
        case MaterialMapType.DEFAULT: {
          meshes = this.modelSliceCache.get(this.tree.fragment[MaterialMapType.DEFAULT], axis, position);
          break;
        }
        case MaterialMapType.ALL: {
          meshes = this.fragmentTroveSliceCache.get(
            this.tree.fragment[MaterialMapType.DEFAULT],
            this.tree.fragment[MaterialMapType.TROVE_TYPE],
            this.tree.fragment[MaterialMapType.TROVE_ALPHA],
            this.tree.fragment[MaterialMapType.TROVE_SPECULAR],
            axis, position
          );
          break;
        }
        case MaterialMapType.TROVE_TYPE: {
          meshes = this.fragmentTypeMaskSliceCache.get(
            this.tree.fragment[MaterialMapType.TROVE_TYPE], this.tree.model, axis, position
          );
          break;
        }
        case MaterialMapType.TROVE_ALPHA: {
          meshes = this.fragmentAlphaMaskSliceCache.get(
            this.tree.fragment[MaterialMapType.TROVE_ALPHA], this.tree.model, axis, position
          );
          break;
        }
        case MaterialMapType.TROVE_SPECULAR: {
          meshes = this.fragmentSpecularMaskSliceCache.get(
            this.tree.fragment[MaterialMapType.TROVE_SPECULAR], this.tree.model, axis, position
          );
          break;
        }
      }

      if (meshes) {
        this.fragmentSliceMesh = meshes[0];
        this.fragmentSliceMesh.position
          .set(this.tree.fragmentOffset[0], this.tree.fragmentOffset[1], this.tree.fragmentOffset[2])
          .setComponent(axis, position);
        this.fragmentSliceMesh.position.multiplyScalar(PIXEL_SCALE);
        this.canvas.scene.add(this.fragmentSliceMesh);
      }

      meshes = this.fragmentGridSliceCache.get(this.tree.fragment[MaterialMapType.DEFAULT], axis, slicePosition);
      if (meshes) {
        this.fragmentGridSliceMesh = meshes[0];
        this.fragmentGridSliceMesh.position
          .set(this.tree.fragmentOffset[0], this.tree.fragmentOffset[1], this.tree.fragmentOffset[2])
          .setComponent(axis, position);
        this.fragmentGridSliceMesh.position.multiplyScalar(PIXEL_SCALE);
        this.canvas.scene.add(this.fragmentGridSliceMesh);
      }
    }
  }

  private patchSlices() {
    this.patchModelSlice();
    this.patchSelectionSlice();
    this.patchFragmentSlice();
  }
}

function createViewCubeTexture(text: string) {
  const canvas = document.createElement('canvas');
  canvas.style.background = 'white';
  canvas.width = 128;
  canvas.height = 128;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = grey200;
  ctx.fillRect(0, 0, 128, 128);

  ctx.textAlign = 'center';
  ctx.font = '28px \'Roboto\'';
  ctx.textBaseline = 'middle';
  ctx.scale(1,1);

  ctx.fillStyle = grey900;
  ctx.fillText(text, 64, 64);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  return texture;
}

class ModelEditorCanvas extends Canvas {
  private viewCubeCamera: THREE.OrthographicCamera;
  private viewCube: THREE.Mesh;
  private viewCubeScene: THREE.Scene;

  component: ModelEditorCanvasComponent;
  geometryFactory: GeometryFactory;
  troveGeometryFactory: TroveGeometryFactory;

  controls: any;

  dispatchAction: DispatchAction;

  cachedTools: { [index: string]: ModelEditorTool<any, any, any> };
  tool: ModelEditorTool<any, any, any>;

  private cameraO: THREE.OrthographicCamera;
  private cameraP: THREE.PerspectiveCamera;

  private state: ModelEditorState;
  private keyboard: Keyboard;

  private light: THREE.DirectionalLight;

  private Mode2dTool: Mode2dTool;

  boundingBoxScene: THREE.Scene;

  onTemporarySizeUpdate: (size: Position) => any;

  private temp1: THREE.Vector3;

  constructor({
    container,
    geometryFactory,
    troveGeometryFactory,
    dispatchAction,
    state,
    cameraO,
    cameraP,
    keyboard,
    onTemporarySizeUpdate,
  }: CanvasOptions) {
    super(container);
    this.temp1 = new THREE.Vector3();

    this.boundingBoxScene = new THREE.Scene();

    this.geometryFactory = geometryFactory;
    this.troveGeometryFactory = troveGeometryFactory;

    this.dispatchAction = dispatchAction;
    this.state = state;

    this.cameraO = cameraO;
    this.cameraP = cameraP;
    this.camera = this.state.common.perspective ? this.cameraP : this.cameraO;
    this.keyboard = keyboard;

    this.cachedTools = {};
    this.onTemporarySizeUpdate = onTemporarySizeUpdate;
  }

  init() {
    this.viewCubeCamera = new THREE.OrthographicCamera(0, 0, 0, 0, -100, 100);
    const viewCubeGeoemtry = new THREE.BoxGeometry(VIEW_CUBE_SIZE, VIEW_CUBE_SIZE, VIEW_CUBE_SIZE);

    const textureLoader = new THREE.TextureLoader();
    const viewCubeMaterial = new THREE.MultiMaterial([
      new THREE.MeshLambertMaterial({ map: createViewCubeTexture('LEFT') }),
      new THREE.MeshLambertMaterial({ map: createViewCubeTexture('RIGHT') }),
      new THREE.MeshLambertMaterial({ map: createViewCubeTexture('TOP') }),
      new THREE.MeshLambertMaterial({ map: createViewCubeTexture('BOTTOM') }),
      new THREE.MeshLambertMaterial({ map: createViewCubeTexture('FRONT') }),
      new THREE.MeshLambertMaterial({ map: createViewCubeTexture('BACK') }),
    ]);

    this.viewCube = new THREE.Mesh(viewCubeGeoemtry, viewCubeMaterial);

    this.viewCubeScene = new THREE.Scene();
    this.viewCubeScene.add(this.viewCube);

    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(0, 0, 1);
    this.viewCubeScene.add(light);

    super.init();

    this.renderer.localClippingEnabled = true;
    this.updateBackgroundColor(this.state.common.backgroundColor);
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

    this.light = new THREE.DirectionalLight(0xffffff, 0.5);

    const d = 15 * PIXEL_SCALE;
    this.light.shadow.camera['left'] = - d;
    this.light.shadow.camera['right'] = d;
    this.light.shadow.camera['top'] = d;
    this.light.shadow.camera['bottom'] = - d;
    this.light.shadow.camera['far'] = 2000;
    this.scene.add(this.light);

    const ambientLight = new THREE.AmbientLight(0x888888);
    this.viewCubeScene.add(ambientLight);

    // add this only if there is no animation loop (requestAnimationFrame)
    this.controls.addEventListener('change', () => {
      this.syncLightToCamera();
      this.tool.onCameraMove();
      this.component.onCameraMove();

      if (this.state.file.present.data.mode2d.enabled) {
        this.Mode2dTool.onCameraMove();
      }

      this.viewCube.quaternion.copy(this.camera.quaternion).inverse();

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

    this.tool = this.getTool(
      this.state.file.present.data.mode2d.enabled, this.state.common.tool,
      this.state.file.present.data.activeMap
    );
    const props = this.tool.mapParamsToProps(this.state);
    this.tool.start(props);

    this.updateControlsTarget(this.state.file.present.data.size);

    this.component = new ModelEditorCanvasComponent(this);
    this.component.start({
      model: this.state.file.present.data,
      common: this.state.common,
    });

    this.controls.update();
    this.syncLightToCamera();

    this.Mode2dTool = new Mode2dTool({
      canvas: this,
      dispatchAction: this.dispatchAction,
      keyboard: this.keyboard,
    });

    this.render();
  }

  updateBackgroundColor(color: Color) {
    this.renderer.setClearColor(new THREE.Color(color.r / 0xff, color.g / 0xff, color.b / 0xff));
  }

  syncLightToCamera() {
    this.light.position.copy(this.camera.position);
    this.light.lookAt(this.controls.target);
  }

  updateCameraOptions() {
    const {clientWidth, clientHeight} = this.container;

    if (this.camera === this.cameraP) {
      this.cameraP.aspect = clientWidth / clientHeight;
      this.cameraP.updateProjectionMatrix();
    }  else if (this.camera === this.cameraO) {
      const cameraO = <THREE.OrthographicCamera>this.camera;
      this.cameraO.left = clientWidth / - 2;
      this.cameraO.right = clientWidth / 2;
      this.cameraO.top = clientHeight / 2;
      this.cameraO.bottom = clientHeight / - 2;
      this.cameraO.updateProjectionMatrix();
    }

    this.viewCubeCamera.left = clientWidth / - 2;
    this.viewCubeCamera.right = clientWidth / 2;
    this.viewCubeCamera.top = clientHeight/ 2;
    this.viewCubeCamera.bottom = clientHeight / - 2;
    this.viewCubeCamera.updateProjectionMatrix();

    this.viewCube.position.set(
      this.viewCubeCamera.right - VIEW_CUBE_SIZE,
      this.viewCubeCamera.top - VIEW_CUBE_SIZE,
      0
    );
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

  onChangeCamera(cameraO: THREE.OrthographicCamera, cameraP: THREE.PerspectiveCamera, size: Position) {
    this.cameraO = cameraO;
    this.cameraP = cameraP;
    this.handleChangeCamera(this.state.common.perspective ? this.cameraP : this.cameraO, size);
  }

  private handleChangeCamera(camera: THREE.Camera, size: Position) {
    this.camera = camera;
    this.controls.object = this.camera;
    this.updateCameraOptions();
    this.updateControlsTarget(size);
    this.controls.update();
  }

  getCameraZoom() {
    if (this.camera === this.cameraP) {
      return 500 / this.temp1.subVectors(this.camera.position, this.controls.target).length();
    } else {
      return this.cameraO.zoom;
    }
  }

  // Lazy getter
  getTool(mode2d: boolean, toolType: ToolType, mapType: MaterialMapType): ModelEditorTool<any, any, any> {
    const uniqueToolType = getUniqueToolType(mode2d, toolType, mapType);

    const tool = this.cachedTools[uniqueToolType];
    if (tool) return tool;

    return this.cachedTools[uniqueToolType] =
      createTool(uniqueToolType, this, this.dispatchAction, this.keyboard);
  }

  onWindowResize() {
    this.updateCameraOptions();

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.tool.onResize();
    this.render();
  }

  onStateChange(nextState: ModelEditorState) {
    if (this.state.common.perspective !== nextState.common.perspective) {
      let dest: THREE.Camera;
      let src: THREE.Camera;

      if (nextState.common.perspective) {
        dest = this.cameraP;
        src = this.cameraO;
      } else {
        dest = this.cameraO;
        src = this.cameraP;
      }

      const length = this.temp1.subVectors(dest.position, this.controls.target).length();
      const direction = this.temp1.subVectors(src.position, this.controls.target).normalize();
      dest.position.copy(direction).multiplyScalar(length).add(this.controls.target);
      this.handleChangeCamera(dest, nextState.file.present.data.size);
    }

    this.component.updateProps({
      model: nextState.file.present.data,
      common: nextState.common,
    });

    if (
         this.state.file.present.data.mode2d.enabled !== nextState.file.present.data.mode2d.enabled
      || this.state.file.present.data.activeMap !== nextState.file.present.data.activeMap
      || this.state.common.tool !== nextState.common.tool
    ) {
      const nextTool = this.getTool(
        nextState.file.present.data.mode2d.enabled, nextState.common.tool, nextState.file.present.data.activeMap
      );
      this.tool.stop();
      this.tool = nextTool;
      const props = this.tool.mapParamsToProps(nextState);
      this.tool.start(props);
    } else {
      const props = this.tool.mapParamsToProps(nextState);
      if (props) this.tool.updateProps(props);
    }

    if (this.state.file.present.data.mode2d.enabled !== nextState.file.present.data.mode2d.enabled) {
      if (nextState.file.present.data.mode2d.enabled) {
        const props = this.Mode2dTool.mapParamsToProps(nextState);
        this.Mode2dTool.start(props);
      } else {
        this.Mode2dTool.stop();
      }
    } else {
      if (this.state.file.present.data.mode2d.enabled) {
        const props = this.Mode2dTool.mapParamsToProps(nextState);
        if (props) this.Mode2dTool.updateProps(props);
      }
    }

    if (this.state.common.backgroundColor !== nextState.common.backgroundColor) {
      this.updateBackgroundColor(nextState.common.backgroundColor);
    }

    this.state = nextState;

    this.render();
  }

  render() {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    this.renderer.clearDepth();
    this.renderer.render(this.boundingBoxScene, this.camera);

    this.tool.onRender();
    this.renderer.render(this.viewCubeScene, this.viewCubeCamera);
  }

  destroy() {
    // Destroy tools
    Object.keys(this.cachedTools).forEach(toolType => this.cachedTools[toolType].destroy());
    this.Mode2dTool.destroy();

    super.destroy();
  }
}

export default ModelEditorCanvas;
