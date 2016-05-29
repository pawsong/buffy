import * as THREE from 'three';
import * as ndarray from 'ndarray';

import { Schema, SchemaType } from '@pasta/helper/lib/diff';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';

import ModelEditorTool, {
  InitParams,
  ToolState,
} from './ModelEditorTool';

import ModelEditorCanvas from '../ModelEditorCanvas';
import { SetState } from '../types';

import {
  Position,
  Color,
  ToolType,
  ModelEditorState,
  DispatchAction,
  GetEditorState,
} from '../../types';

import {
  voxelAddBatch,
  CHANGE_PALETTE_COLOR, ChangePaletteColorAction,
} from '../../actions';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
  DESIGN_IMG_SIZE,
} from '../../../../canvas/Constants';

const gridVertexShader = require('raw!../shaders/grid2.vert');
const gridFragmentShader = require('raw!../shaders/grid2.frag');

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAW = 'draw';

interface DrawEnterParams {
  anchor: THREE.Vector3;
  normal: THREE.Vector3;
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: BoxTool) {
    super();

    this.cursor = new Cursor(tool.canvas, {
      mesh: tool.cursorMesh,
      offset: [0, 0, 0],
      getInteractables: () => [
        this.tool.canvas.plane,
        this.tool.canvas.component.modelMesh,
      ],
      onMouseDown: params => this.handleMouseDown(params),
    });
  }

  handleMouseDown({ event, intersect }: CursorEventParams) {
    const position = this.cursor.getPosition();
    if (position) {
      this.transitionTo(STATE_DRAW, <DrawEnterParams>{
        anchor: position,
        normal: intersect.face.normal,
      });
    }
  }

  onEnter() {
    this.tool.setCursorSize(1, 1, 1);
    this.cursor.start();
  }

  onLeave() {
    this.cursor.stop();
    this.tool.cursorMesh.visible = false;
  }
}

class DrawState extends ToolState {
  private cursor: Cursor;

  private anchor1: THREE.Vector3;
  private anchorSize: THREE.Vector3;

  private anchor2: number;

  private normal: THREE.Vector3;
  private normalFilter: THREE.Vector3;

  private target: THREE.Vector3;
  private target2: number;

  private targetStep2: number;

  private handleInteract: (params: CursorEventParams) => any;
  private handleMouseUp: (params: CursorEventParams) => any;

  private temp1: THREE.Vector3;
  private temp2: THREE.Vector3;
  private temp3: THREE.Vector3;
  private temp4: THREE.Vector3;

  constructor(
    private tool: BoxTool,
    private canvas: ModelEditorCanvas,
    private dispatchAction: DispatchAction
  ) {
    super();

    const offset = new THREE.Vector3();
    const intersectables = [this.tool.drawGuide];

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      getInteractables: () => intersectables,
      getOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      onInteract: params => this.handleInteract(params),
      onMouseUp: params => this.handleMouseUp(params),
    });

    this.temp1 = new THREE.Vector3();
    this.temp2 = new THREE.Vector3();
    this.temp3 = new THREE.Vector3();
    this.temp4 = new THREE.Vector3();

    this.normal = new THREE.Vector3();
    this.normalFilter = new THREE.Vector3();

    this.anchor1 = new THREE.Vector3();
    this.anchorSize = new THREE.Vector3();

    this.anchor2 = 0;

    this.target = new THREE.Vector3();
    this.target2 = 0;
  }

  onEnter({ anchor, normal }: DrawEnterParams) {
    document.addEventListener('keydown', this.handleKeyDown, false);

    // Init handlers
    this.handleInteract = this.handleInteractInStep1;
    this.handleMouseUp = this.handleMouseUpInStep1;

    // Init data
    this.normal.copy(normal).round().multiply(this.normal); // Always positive.
    this.normalFilter.copy(this.normal).subScalar(1).multiplyScalar(-1);

    this.anchor1.copy(anchor);
    this.target.copy(this.anchor1);

    // Show and move draw guides
    this.tool.drawGuide.visible = true;

    const scaledAnchor = anchor.multiplyScalar(PIXEL_SCALE);

    this.tool.drawGuide.position.copy(this.normal).multiply(scaledAnchor);
    this.tool.drawGuide.scale
      .copy(this.normal).subScalar(1).multiplyScalar(-1)
      .multiplyScalar(DESIGN_IMG_SIZE - 1).addScalar(1)
      .multiplyScalar(PIXEL_SCALE);

    // Init cursor mesh
    this.tool.cursorMesh.visible = true;
    this.tool.cursorMesh.position.copy(scaledAnchor);
    this.tool.setCursorSize(1, 1, 1);

    this.cursor.start();
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.keyCode === 27) {
      this.transitionTo(STATE_WAIT);
      this.canvas.render();
    }
  }

  /* Step 1: Get values for surface */

  handleInteractInStep1 = ({ } : CursorEventParams) => {
    const position = this.cursor.getPosition();
    if (!position) return;

    if (this.target.equals(position)) return;
    this.target.copy(position);

    const displacement = position.sub(this.anchor1);

    this.tool.cursorMesh.position.set(
      this.anchor1.x + Math.min(displacement.x, 0),
      this.anchor1.y + Math.min(displacement.y, 0),
      this.anchor1.z + Math.min(displacement.z, 0)
    ).multiplyScalar(PIXEL_SCALE);

    this.tool.setCursorSize(
      Math.abs(displacement.x) + 1,
      Math.abs(displacement.y) + 1,
      Math.abs(displacement.z) + 1
    );
  }

  handleMouseUpInStep1 = ({ } : CursorEventParams) => {
    const minX = Math.min(this.anchor1.x, this.target.x);
    const minY = Math.min(this.anchor1.y, this.target.y);
    const minZ = Math.min(this.anchor1.z, this.target.z);

    const width  = Math.max(this.anchor1.x, this.target.x) - minX;
    const height = Math.max(this.anchor1.y, this.target.y) - minY;
    const depth  = Math.max(this.anchor1.z, this.target.z) - minZ;

    this.anchor1.set(minX, minY, minZ);
    this.anchorSize.set(width + 1, height + 1, depth + 1);

    this.tool.drawGuide.position
      .copy(this.anchor1)
      .multiply(this.normalFilter)
      .multiplyScalar(PIXEL_SCALE);

    this.tool.drawGuide.scale
      .copy(this.anchorSize)
      .multiply(this.normalFilter)
      .add(this.temp1.copy(this.normal).multiplyScalar(DESIGN_IMG_SIZE))
      .multiplyScalar(PIXEL_SCALE);

    this.anchor2 = this.target2 = this.target.dot(this.normal);

    // Transition to Step 2
    this.handleInteract = this.handleInteractInStep2;
    this.handleMouseUp = this.handleMouseUpInStep2;
  }

  /* Step 2: Get value for normal direction */

  handleInteractInStep2 = ({ } : CursorEventParams) => {
    const position = this.cursor.getPosition();
    if (!position) return;

    const target = position.dot(this.normal);

    if (this.target2 === target) return;
    this.target2 = target;

    this.tool.cursorMesh.position
      .multiply(this.normalFilter)
      .add(this.temp1.copy(this.normal).multiplyScalar(PIXEL_SCALE * Math.min(this.target2, this.anchor2)));

    const cursorSize = this.temp1.copy(this.anchorSize)
      .multiply(this.normalFilter)
      .add(this.temp2.copy(this.normal).multiplyScalar(Math.abs(this.target2 - this.anchor2) + 1));

    this.tool.setCursorSize(cursorSize.x, cursorSize.y, cursorSize.z);
  }

  handleMouseUpInStep2 = ({ } : CursorEventParams) => {
    const lo = this.temp1.copy(this.anchor1).multiply(this.normalFilter).add(
      this.temp2.copy(this.normal).multiplyScalar(Math.min(this.target2, this.anchor2))
    );

    const hi = this.temp3.copy(this.anchor1).add(this.anchorSize).subScalar(1).multiply(this.normalFilter).add(
      this.temp4.copy(this.normal).multiplyScalar(Math.max(this.target2, this.anchor2))
    );

    this.dispatchAction(voxelAddBatch([
      lo.x, lo.y, lo.z,
      hi.x, hi.y, hi.z,
    ], this.tool.props.color));

    this.transitionTo(STATE_WAIT);
  }

  onLeave() {
    document.removeEventListener('keydown', this.handleKeyDown, false);

    // Hide meshes.

    this.tool.drawGuide.visible = false;

    this.cursor.stop();
    this.tool.cursorMesh.visible = false;
  }
}

interface BoxToolProps {
  color: Color;
}

class BoxTool extends ModelEditorTool<BoxToolProps, void, BoxToolProps> {
  canvas: ModelEditorCanvas;

  drawGuideMaterial: THREE.MeshBasicMaterial;
  drawGuide: THREE.Mesh;

  cursorColor: THREE.Vector3;
  cursorScale: THREE.Vector3;
  cursorMesh: THREE.Mesh;

  getToolType() { return ToolType.box; }

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        color: {
          type: SchemaType.ANY,
        },
      },
    };
  }

  mapParamsToProps(state: ModelEditorState) {
    return { color: state.common.paletteColor };
  }

  render() { return this.props; }

  patch(diff: BoxToolProps) {
    this.setCursorColor(diff.color || this.props.color);
  }

  createGuideGeometry(width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometry.translate(width / 2, height / 2, depth / 2);
    return geometry;
  }

  setCursorSize(width: number, height: number, depth: number) {
    this.cursorScale.set(width, height, depth);
    this.cursorMesh.scale.copy(this.cursorScale).multiplyScalar(PIXEL_SCALE);
  }

  setCursorColor(color: Color) {
    this.cursorColor.set(color.r / 0xff, color.g / 0xff, color.b / 0xff);
  }

  init(params: InitParams) {
    this.canvas = params.canvas;

    // Setup cursor

    const cursorGeometry = new THREE.BoxGeometry(1, 1, 1);
    cursorGeometry.translate(0.5, 0.5, 0.5);

    this.cursorColor = new THREE.Vector3();
    this.cursorScale = new THREE.Vector3();
    const cursorMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: this.cursorColor },
        scale: { value: this.cursorScale },
        opacity: { type: 'f', value: 0.5 },
      },
      vertexShader: gridVertexShader,
      fragmentShader: gridFragmentShader,
      transparent: true,
    });
    cursorMaterial.extensions.derivatives = true;
    this.cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);

    // Setup draw guides

    this.drawGuideMaterial = new THREE.MeshBasicMaterial({
      visible: false,
    });

    const drawGuideGeometry = this.createGuideGeometry(1, 1, 1);
    this.drawGuide = new THREE.Mesh(drawGuideGeometry, this.drawGuideMaterial);
    this.drawGuide.visible = false;

    // Setup states

    const wait = new WaitState(this);
    const draw = new DrawState(this, params.canvas, params.dispatchAction);

    return {
      [STATE_WAIT]: wait,
      [STATE_DRAW]: draw,
    };
  }

  onStart() {
    this.canvas.scene.add(this.cursorMesh);
    this.canvas.scene.add(this.drawGuide);
  }

  onStop() {
    this.canvas.scene.remove(this.cursorMesh);
    this.canvas.scene.remove(this.drawGuide);
  }

  destroy() {

  }
}

export default BoxTool;
