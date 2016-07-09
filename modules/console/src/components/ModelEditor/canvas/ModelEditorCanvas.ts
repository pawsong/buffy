import { grey200, grey900 } from 'material-ui/styles/colors';
import THREE from 'three';
import * as ndarray from 'ndarray';
const mapValues = require('lodash/mapValues');
const findLastIndex = require('lodash/findLastIndex');
import { createSelector, Selector } from 'reselect';

import ModelEditorTool from './tools/ModelEditorTool';
import createTool from './tools';

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
  GetEditorState,
  VoxelData,
  Position,
  Axis,
} from '../types';

import {
  MaterialMapType,
} from '../../../types';

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

const tiledGlassVertexShader = require('raw!./shaders/tiledGlass.vert');
const tiledGlassFragmentShader = require('raw!./shaders/tiledGlass.frag');

import SliceCache from './SliceCache';
import MaskSliceCache from './MaskSliceCache';
import TroveSliceCache from './TroveSliceCache';

type ComponentProps = VoxelData;

interface ComponentState {
  fragment?: ndarray.Ndarray;
  mode2d?: {
    axis: Axis;
    position: number;
  }
}

interface ComponentTree {
  activeMap: MaterialMapType;
  maps: {
    [index: number]: ndarray.Ndarray;
  };
  size: Position;
  model: ndarray.Ndarray;
  selection: ndarray.Ndarray;
  fragment: ndarray.Ndarray;
  fragmentOffset: Position;
  mode2d?: {
    enabled: boolean;
    axis: Axis;
    position: number;
  }
}

const PLANE_GRID_STEP = 4;

const px = new THREE.Vector3(   1 ,   0  ,   0 );
const py = new THREE.Vector3(   0 ,   1  ,   0 );
const pz = new THREE.Vector3(   0 ,   0  ,   1 );

const nx = new THREE.Vector3( - 1 ,   0  ,   0 );
const ny = new THREE.Vector3(   0 , - 1  ,   0 );
const nz = new THREE.Vector3(   0 ,   0  , - 1 );

// Prevent flickering
const CLIPPING_OFFSET = 1;

const VIEW_CUBE_SIZE = 70;

class ModelEditorCanvasComponent extends SimpleComponent<ComponentProps, ComponentState, ComponentTree> {
  private emptyMesh: THREE.Mesh;

  private planeMaterial: THREE.ShaderMaterial;
  plane: THREE.Mesh;

  private modelMultiMaterial: THREE.MultiMaterial;
  private modelSliceMultiMaterial: THREE.MultiMaterial;

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
  fragmentedSelectionSelector: Selector<any, any>;

  private temp1: THREE.Vector3;

  private modelSliceCache: SliceCache;
  private selectionSliceCache: SliceCache;
  private fragmentSliceCache: SliceCache;

  typeMaskGeometryFactory: MaskGeometryFactory;
  alphaMaskGeometryFactory: MaskGeometryFactory;
  specularMaskGeometryFactory: MaskGeometryFactory;
  troveGeometryFactory: TroveGeometryFactory;

  private typeMaskSliceCache: MaskSliceCache;
  private alphaMaskSliceCache: MaskSliceCache;
  private specularMaskSliceCache: MaskSliceCache;
  private troveSliceCache: TroveSliceCache;

  mode2dPlaneMesh: THREE.Mesh;

  mode2dClippingPlane: THREE.Plane;
  model2DSliceMesh: THREE.Mesh;
  modelGrid2DSliceMesh: THREE.Mesh;
  selectionSliceMesh: THREE.Mesh;
  fragmentSliceMesh: THREE.Mesh;

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
      (props: ComponentProps, state: ComponentState) => props.maps[MaterialMapType.DEFAULT],
      (props: ComponentProps, state: ComponentState) => state.fragment,
      (model, fragment) => {
        const fragmentedModel = ndarray(model.data.slice(), model.shape);
        ndExclude(fragmentedModel, this.state.fragment);
        return fragmentedModel;
      }
    );

    this.fragmentedSelectionSelector = createSelector(
      (props: ComponentProps, state: ComponentState) => props.selection,
      (props: ComponentProps, state: ComponentState) => state.fragment,
      (selection, fragment) => {
        const fragmentedSelection = ndarray(selection.data.slice(), selection.shape);
        ndExclude(fragmentedSelection, this.state.fragment);
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

    this.typeMaskGeometryFactory = new MaskGeometryFactory(mapinfo[MaterialMapType.TROVE_TYPE].defaultColor);
    this.alphaMaskGeometryFactory = new MaskGeometryFactory(mapinfo[MaterialMapType.TROVE_ALPHA].defaultColor);
    this.specularMaskGeometryFactory = new MaskGeometryFactory(mapinfo[MaterialMapType.TROVE_SPECULAR].defaultColor);
    this.troveGeometryFactory = new TroveGeometryFactory();

    // MultiMaterial

    let mType1Alpha1Specular1: THREE.MeshPhongMaterial;
    let mType1Alpha1Specular2: THREE.MeshPhongMaterial;
    let mType1Alpha1Specular3: THREE.MeshPhongMaterial;
    let mType1Alpha1Specular4: THREE.MeshPhongMaterial;
    let mType1Alpha1Specular5: THREE.MeshPhongMaterial;

    let mType2Alpha1Specular1: THREE.MeshPhongMaterial;
    let mType2Alpha2Specular1: THREE.MeshPhongMaterial;
    let mType2Alpha3Specular1: THREE.MeshPhongMaterial;
    let mType2Alpha4Specular1: THREE.MeshPhongMaterial;
    let mType2Alpha5Specular1: THREE.MeshPhongMaterial;
    let mType2Alpha6Specular1: THREE.MeshPhongMaterial;
    let mType2Alpha7Specular1: THREE.MeshPhongMaterial;
    let mType2Alpha8Specular1: THREE.MeshPhongMaterial;

    let mType3Alpha1Specular1: THREE.ShaderMaterial;
    let mType3Alpha2Specular1: THREE.ShaderMaterial;
    let mType3Alpha3Specular1: THREE.ShaderMaterial;
    let mType3Alpha4Specular1: THREE.ShaderMaterial;
    let mType3Alpha5Specular1: THREE.ShaderMaterial;
    let mType3Alpha6Specular1: THREE.ShaderMaterial;
    let mType3Alpha7Specular1: THREE.ShaderMaterial;
    let mType3Alpha8Specular1: THREE.ShaderMaterial;

    let mType4Alpha1Specular1: THREE.MeshPhongMaterial;

    let mType5Alpha1Specular1: THREE.MeshPhongMaterial;
    let mType5Alpha2Specular1: THREE.MeshPhongMaterial;
    let mType5Alpha3Specular1: THREE.MeshPhongMaterial;
    let mType5Alpha4Specular1: THREE.MeshPhongMaterial;
    let mType5Alpha5Specular1: THREE.MeshPhongMaterial;
    let mType5Alpha6Specular1: THREE.MeshPhongMaterial;
    let mType5Alpha7Specular1: THREE.MeshPhongMaterial;
    let mType5Alpha8Specular1: THREE.MeshPhongMaterial;

    // TYPE 1

    // Rough (default)
    mType1Alpha1Specular1 = new THREE.MeshPhongMaterial({
      vertexColors: THREE.VertexColors,
    });

    // Metal
    mType1Alpha1Specular2 = new THREE.MeshPhongMaterial({
      vertexColors: THREE.VertexColors,
    });
    mType1Alpha1Specular2.specular = mType1Alpha1Specular2.color.multiplyScalar(0.5);

    // TODO: Water
    mType1Alpha1Specular3 = new THREE.MeshPhongMaterial({
      vertexColors: THREE.VertexColors,
    });

    // TODO: Iridescent
    mType1Alpha1Specular4 = new THREE.MeshPhongMaterial({
      vertexColors: THREE.VertexColors,
    });

    // TODO: Waxy
    mType1Alpha1Specular5 = new THREE.MeshPhongMaterial({
      vertexColors: THREE.VertexColors,
    });

    // TYPE 2

    mType2Alpha1Specular1 = new THREE.MeshPhongMaterial({
      vertexColors: THREE.VertexColors,
    });
    mType2Alpha1Specular1.transparent = true;
    mType2Alpha1Specular1.opacity = 0x10 / 0xff;

    mType2Alpha2Specular1 = mType2Alpha1Specular1.clone();
    mType2Alpha2Specular1.opacity = 0x30 / 0xff;

    mType2Alpha3Specular1 = mType2Alpha1Specular1.clone();
    mType2Alpha3Specular1.opacity = 0x50 / 0xff;

    mType2Alpha4Specular1 = mType2Alpha1Specular1.clone();
    mType2Alpha4Specular1.opacity = 0x70 / 0xff;

    mType2Alpha5Specular1 = mType2Alpha1Specular1.clone();
    mType2Alpha5Specular1.opacity = 0x90 / 0xff;

    mType2Alpha6Specular1 = mType2Alpha1Specular1.clone();
    mType2Alpha6Specular1.opacity = 0xb0 / 0xff;

    mType2Alpha7Specular1 = mType2Alpha1Specular1.clone();
    mType2Alpha7Specular1.opacity = 0xd0 / 0xff;

    mType2Alpha8Specular1 = mType2Alpha1Specular1.clone();
    mType2Alpha8Specular1.opacity = 0xf0 / 0xff;

    // TYPE 3

    mType3Alpha1Specular1 = new THREE.ShaderMaterial({
      vertexShader: tiledGlassVertexShader,
      fragmentShader: tiledGlassFragmentShader,
      transparent: true,
    });
    mType3Alpha1Specular1.extensions.derivatives = true;
    mType3Alpha1Specular1.uniforms = { opacity: { type: 'f', value: 0x10 / 0xff } };

    mType3Alpha2Specular1 = mType3Alpha1Specular1.clone();
    mType3Alpha2Specular1.uniforms = { opacity: { type: 'f', value: 0x30 / 0xff } };

    mType3Alpha3Specular1 = mType3Alpha1Specular1.clone();
    mType3Alpha3Specular1.uniforms = { opacity: { type: 'f', value: 0x50 / 0xff } };

    mType3Alpha4Specular1 = mType3Alpha1Specular1.clone();
    mType3Alpha4Specular1.uniforms = { opacity: { type: 'f', value: 0x70 / 0xff } };

    mType3Alpha5Specular1 = mType3Alpha1Specular1.clone();
    mType3Alpha5Specular1.uniforms = { opacity: { type: 'f', value: 0x90 / 0xff } };

    mType3Alpha6Specular1 = mType3Alpha1Specular1.clone();
    mType3Alpha6Specular1.uniforms = { opacity: { type: 'f', value: 0xb0 / 0xff } };

    mType3Alpha7Specular1 = mType3Alpha1Specular1.clone();
    mType3Alpha7Specular1.uniforms = { opacity: { type: 'f', value: 0xd0 / 0xff } };

    mType3Alpha8Specular1 = mType3Alpha1Specular1.clone();
    mType3Alpha8Specular1.uniforms = { opacity: { type: 'f', value: 0xf0 / 0xff } };

    // TYPE 4

    mType4Alpha1Specular1 = new THREE.MeshPhongMaterial({
      vertexColors: THREE.VertexColors,
    });
    mType4Alpha1Specular1.emissive = mType4Alpha1Specular1.color.multiplyScalar(0.5);

    // TYPE 5

    mType5Alpha1Specular1 = new THREE.MeshPhongMaterial({
      vertexColors: THREE.VertexColors,
    });
    mType5Alpha1Specular1.emissive = mType5Alpha1Specular1.color.multiplyScalar(0.5);
    mType5Alpha1Specular1.transparent = true;
    mType5Alpha1Specular1.opacity = 0x10 / 0xff;

    mType5Alpha2Specular1 = mType5Alpha1Specular1.clone();
    mType5Alpha2Specular1.opacity = 0x30 / 0xff;

    mType5Alpha3Specular1 = mType5Alpha1Specular1.clone();
    mType5Alpha3Specular1.opacity = 0x50 / 0xff;

    mType5Alpha4Specular1 = mType5Alpha1Specular1.clone();
    mType5Alpha4Specular1.opacity = 0x70 / 0xff;

    mType5Alpha5Specular1 = mType5Alpha1Specular1.clone();
    mType5Alpha5Specular1.opacity = 0x90 / 0xff;

    mType5Alpha6Specular1 = mType5Alpha1Specular1.clone();
    mType5Alpha6Specular1.opacity = 0xb0 / 0xff;

    mType5Alpha7Specular1 = mType5Alpha1Specular1.clone();
    mType5Alpha7Specular1.opacity = 0xd0 / 0xff;

    mType5Alpha8Specular1 = mType5Alpha1Specular1.clone();
    mType5Alpha8Specular1.opacity = 0xf0 / 0xff;

    // Multi Material

    this.modelSliceMultiMaterial = new THREE.MultiMaterial([
      new THREE.MeshBasicMaterial({ visible: false }), // PADDING

      mType1Alpha1Specular1, // const TYPE1_ALPHA1_SPECULAR1 = 0x01000000; // 01
      mType1Alpha1Specular2, // const TYPE1_ALPHA1_SPECULAR2 = 0x02000000; // 02
      mType1Alpha1Specular3, // const TYPE1_ALPHA1_SPECULAR3 = 0x03000000; // 03
      mType1Alpha1Specular4, // const TYPE1_ALPHA1_SPECULAR4 = 0x04000000; // 04
      mType1Alpha1Specular5, // const TYPE1_ALPHA1_SPECULAR5 = 0x05000000; // 05

      mType4Alpha1Specular1, // const TYPE4_ALPHA1_SPECULAR1 = 0x06000000; // 06

      mType2Alpha1Specular1, // const TYPE2_ALPHA1_SPECULAR1 = 0x07000000; // 07
      mType2Alpha2Specular1, // const TYPE2_ALPHA2_SPECULAR1 = 0x08000000; // 08
      mType2Alpha3Specular1, // const TYPE2_ALPHA3_SPECULAR1 = 0x09000000; // 09
      mType2Alpha4Specular1, // const TYPE2_ALPHA4_SPECULAR1 = 0x0a000000; // 10
      mType2Alpha5Specular1, // const TYPE2_ALPHA5_SPECULAR1 = 0x0b000000; // 11
      mType2Alpha6Specular1, // const TYPE2_ALPHA6_SPECULAR1 = 0x0c000000; // 12
      mType2Alpha7Specular1, // const TYPE2_ALPHA7_SPECULAR1 = 0x0d000000; // 13
      mType2Alpha8Specular1, // const TYPE2_ALPHA8_SPECULAR1 = 0x0e000000; // 14

      mType3Alpha1Specular1, // const TYPE3_ALPHA1_SPECULAR1 = 0x0f000000; // 15
      mType3Alpha2Specular1, // const TYPE3_ALPHA2_SPECULAR1 = 0x10000000; // 16
      mType3Alpha3Specular1, // const TYPE3_ALPHA3_SPECULAR1 = 0x11000000; // 17
      mType3Alpha4Specular1, // const TYPE3_ALPHA4_SPECULAR1 = 0x12000000; // 18
      mType3Alpha5Specular1, // const TYPE3_ALPHA5_SPECULAR1 = 0x13000000; // 19
      mType3Alpha6Specular1, // const TYPE3_ALPHA6_SPECULAR1 = 0x14000000; // 20
      mType3Alpha7Specular1, // const TYPE3_ALPHA7_SPECULAR1 = 0x15000000; // 21
      mType3Alpha8Specular1, // const TYPE3_ALPHA8_SPECULAR1 = 0x16000000; // 22

      mType5Alpha1Specular1, // const TYPE5_ALPHA1_SPECULAR1 = 0x17000000; // 23
      mType5Alpha2Specular1, // const TYPE5_ALPHA2_SPECULAR1 = 0x18000000; // 24
      mType5Alpha3Specular1, // const TYPE5_ALPHA3_SPECULAR1 = 0x19000000; // 25
      mType5Alpha4Specular1, // const TYPE5_ALPHA4_SPECULAR1 = 0x1a000000; // 26
      mType5Alpha5Specular1, // const TYPE5_ALPHA5_SPECULAR1 = 0x1b000000; // 27
      mType5Alpha6Specular1, // const TYPE5_ALPHA6_SPECULAR1 = 0x1c000000; // 28
      mType5Alpha7Specular1, // const TYPE5_ALPHA7_SPECULAR1 = 0x1d000000; // 29
      mType5Alpha8Specular1, // const TYPE5_ALPHA8_SPECULAR1 = 0x1e000000; // 30
    ]);
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

    const model = this.props.maps[MaterialMapType.DEFAULT];

    const { shape } = model;
    const fragment = ndarray(new Int32Array(shape[0] * shape[1] * shape[2]), model.shape);
    ndCopyWithFilter(fragment, model, this.props.selection);

    this.setState({ fragment });
  }

  setTemporaryFragmentSlice() {
    if (!this.props.selection) return;

    const model = this.props.maps[MaterialMapType.DEFAULT];

    const { shape } = model;

    const fragment = ndarray(new Int32Array(shape[0] * shape[1] * shape[2]), shape);

    const modelSlice = getSlice(this.props.mode2d.axis, this.props.mode2d.position, model);
    const selectionSlice = getSlice(this.props.mode2d.axis, this.props.mode2d.position, this.props.selection);
    const fragmentSlice = getSlice(this.props.mode2d.axis, this.props.mode2d.position, fragment);

    ndCopyWithFilter(fragmentSlice, modelSlice, selectionSlice);
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
  }

  moveFragmentSliceMesh(displacement: THREE.Vector3) {
    if (this.fragmentSliceMesh.visible) {
      this.fragmentSliceMesh.position
        .copy(displacement)
        .setComponent(this.tree.mode2d.axis, this.tree.mode2d.position);
      this.fragmentSliceMesh.position.multiplyScalar(PIXEL_SCALE);
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

    this.mode2dPlaneMesh.scale.set(this.props.size[u], this.props.size[v], 1);
    this.mode2dPlaneMesh.position.setComponent(u, this.props.size[u] / 2 * PIXEL_SCALE);
    this.mode2dPlaneMesh.position.setComponent(v, this.props.size[v] / 2 * PIXEL_SCALE);

    // Move clipping plane
    switch(axis) {
      case Axis.X: {
        if (this.temp1.x > 0) {
          this.mode2dPlaneMesh.rotation.set(0, - Math.PI / 2, Math.PI / 2);
          this.mode2dPlaneMesh.position.setX((position + 1) * PIXEL_SCALE);
          this.mode2dClippingPlane.set(px, (- position - 1) * PIXEL_SCALE + CLIPPING_OFFSET);
        } else {
          this.mode2dPlaneMesh.rotation.set(0, Math.PI / 2, Math.PI / 2);
          this.mode2dPlaneMesh.position.setX(position * PIXEL_SCALE);
          this.mode2dClippingPlane.set(nx, position * PIXEL_SCALE + CLIPPING_OFFSET);
        }
        break;
      }
      case Axis.Y: {
        if (this.temp1.y > 0) {
          this.mode2dPlaneMesh.rotation.set(Math.PI / 2, 0, Math.PI / 2);
          this.mode2dPlaneMesh.position.setY((position + 1) * PIXEL_SCALE);
          this.mode2dClippingPlane.set(py, (- position - 1) * PIXEL_SCALE + CLIPPING_OFFSET);
        } else {
          this.mode2dPlaneMesh.rotation.set(- Math.PI / 2, 0, Math.PI / 2);
          this.mode2dPlaneMesh.position.setY(position * PIXEL_SCALE);
          this.mode2dClippingPlane.set(ny, position * PIXEL_SCALE + CLIPPING_OFFSET);
        }
        break;
      }
      case Axis.Z: {
        if (this.temp1.z > 0) {
          this.mode2dPlaneMesh.rotation.set(Math.PI, 0, 0);
          this.mode2dPlaneMesh.position.setZ((position + 1) * PIXEL_SCALE);
          this.mode2dClippingPlane.set(pz, (- position - 1) * PIXEL_SCALE + CLIPPING_OFFSET);
        } else {
          this.mode2dPlaneMesh.rotation.set(0, 0, 0);
          this.mode2dPlaneMesh.position.setZ(position * PIXEL_SCALE);
          this.mode2dClippingPlane.set(nz, position * PIXEL_SCALE + CLIPPING_OFFSET);
        }
        break;
      }
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
      : this.props.maps[MaterialMapType.DEFAULT];

    // Hide selection when temporary fragment exists.
    const selection = this.state.fragment && this.props.selection
      ? this.fragmentedSelectionSelector(this.props, this.state)
      : this.props.selection;

    const fragment = this.state.fragment || this.props.fragment;

    return {
      activeMap: this.props.activeMap,
      maps: this.props.maps,
      model,
      selection,
      fragment,
      fragmentOffset: this.props.fragmentOffset,
      size: this.props.size,
      mode2d: Object.assign({}, this.props.mode2d, this.state.mode2d),
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

      if (this.tree.mode2d.enabled) {
        this.patchSlices();
        this.updateClippingPlane(this.tree.mode2d.axis, this.tree.mode2d.position);
      }
    }

    if (
         diff.hasOwnProperty('model')
      || diff.hasOwnProperty('activeMap')
      || (diff.maps && diff.maps.hasOwnProperty(this.tree.activeMap))
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
          geometry = this.troveGeometryFactory.getGeometry(
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

        if (this.tree.activeMap !== MaterialMapType.ALL) {
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

      if (this.tree.mode2d.enabled) this.patchSelectionSlice();
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
        if (diff.mode2d.enabled) {
          this.canvas.boundingBoxScene.remove(this.selectionBoundingBox.edges);
          this.canvas.boundingBoxScene.remove(this.fragmentBoundingBox.edges);
          this.canvas.scene.add(this.mode2dPlaneMesh);

          this.modelMaterial.transparent = true;

          const clippingPlanes = [this.mode2dClippingPlane];

          this.modelMaterial['clippingPlanes'] =
          this.modelGridMaterial['clippingPlanes'] =
          this.selectionMaterial['clippingPlanes'] =
          this.fragmentMaterial['clippingPlanes'] = clippingPlanes;
          this.modelMultiMaterial.materials.forEach(material => material['clippingPlanes'] = clippingPlanes);

          this.patchSlices();
          this.updateClippingPlane(this.tree.mode2d.axis, this.tree.mode2d.position);
        } else {
          this.canvas.boundingBoxScene.add(this.selectionBoundingBox.edges);
          this.canvas.boundingBoxScene.add(this.fragmentBoundingBox.edges);

          this.removeSlices();
          this.canvas.scene.remove(this.mode2dPlaneMesh);

          this.modelMaterial.transparent = false;

          this.modelMaterial['clippingPlanes'] =
          this.modelGridMaterial['clippingPlanes'] =
          this.selectionMaterial['clippingPlanes'] =
          this.fragmentMaterial['clippingPlanes'] = [];
          this.modelMultiMaterial.materials.forEach(material => material['clippingPlanes'] = []);
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

      if (meshes[1] && this.tree.activeMap !== MaterialMapType.ALL) {
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
    if (slicePosition >= 0 && slicePosition < this.tree.fragment.shape[axis]) {
      const meshes = this.fragmentSliceCache.get(this.tree.fragment, axis, slicePosition);
      if (meshes) {
        this.fragmentSliceMesh = meshes[0];
        this.fragmentSliceMesh.position
          .set(this.tree.fragmentOffset[0], this.tree.fragmentOffset[1], this.tree.fragmentOffset[2])
          .setComponent(axis, position);
        this.fragmentSliceMesh.position.multiplyScalar(PIXEL_SCALE);
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

  boundingBoxScene: THREE.Scene;

  constructor({
    container,
    geometryFactory,
    dispatchAction,
    state,
    camera,
    keyboard,
  }: CanvasOptions) {
    super(container);
    this.boundingBoxScene = new THREE.Scene();

    this.geometryFactory = geometryFactory;

    this.dispatchAction = dispatchAction;
    this.state = state;

    this.camera = camera;
    this.keyboard = keyboard;

    this.cachedTools = {};
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

    this.renderer['localClippingEnabled'] = true;
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

    this.tool = this.getTool(this.state.file.present.data.mode2d.enabled, this.state.common.tool);
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
    this.viewCubeCamera.left = this.camera.left = this.container.clientWidth / - 2;
    this.viewCubeCamera.right = this.camera.right = this.container.clientWidth / 2;
    this.viewCubeCamera.top = this.camera.top = this.container.clientHeight / 2;
    this.viewCubeCamera.bottom = this.camera.bottom = this.container.clientHeight / - 2;
    this.camera.updateProjectionMatrix();
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

  onChangeCamera(camera: THREE.OrthographicCamera, size: Position) {
    this.camera = camera;
    this.controls.object = this.camera;
    this.updateCameraOptions();
    this.updateControlsTarget(size);
    this.controls.update();
  }

  // Lazy getter
  getTool(mode2d: boolean, toolType: ToolType): ModelEditorTool<any, any, any> {
    const uniqueToolType = getUniqueToolType(mode2d, toolType);

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
    this.component.updateProps(nextState.file.present.data);

    if (
         this.state.file.present.data.mode2d.enabled !== nextState.file.present.data.mode2d.enabled
      || this.state.common.tool !== nextState.common.tool
    ) {
      const nextTool = this.getTool(
        nextState.file.present.data.mode2d.enabled, nextState.common.tool
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
