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
const STATE_ROTATE = 'rotate';

class RotateState extends ToolState {
  _onMouseUp = () => this.transitionTo(STATE_WAIT);
  onEnter() { document.addEventListener('mouseup', this._onMouseUp, false); }
  onLeave() { document.removeEventListener('mouseup', this._onMouseUp, false); }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: BrushTool) {
    super();

    this.cursor = new Cursor(tool.canvas, {
      mesh: tool.cursorMesh,
      offset: [0, 0, 0],
      getInteractables: () => [
        this.tool.canvas.plane,
        this.tool.canvas.modelMesh,
      ],
      onMouseDown: params => this.handleMouseDown(params),
    });
  }

  handleMouseDown({ event, intersect }: CursorEventParams) {
    const position = this.cursor.getPosition();
    if (position) {
      this.transitionTo(STATE_DRAW, position);
    } else {
      this.transitionTo(STATE_ROTATE);
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
  private anchor: THREE.Vector3;
  private target: THREE.Vector3;

  constructor(
    private tool: BrushTool,
    private canvas: ModelEditorCanvas,
    private dispatchAction: DispatchAction
  ) {
    super();

    const offset = new THREE.Vector3();

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      getInteractables: () => [
        this.tool.drawGuideX,
        this.tool.drawGuideY,
        this.tool.drawGuideZ,
      ],
      getOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      onMouseUp: params => this.handleMouseUp(params),
      onInteract : params => this.handleInteract(params),
    });

    this.anchor = new THREE.Vector3();
    this.target = new THREE.Vector3();
  }

  onEnter(cursorPosition: THREE.Vector3) {
    // Disable rotation.

    this.canvas.controls.enableRotate = false;

    // Init data

    this.anchor.copy(cursorPosition);
    this.target.copy(this.anchor);

    // Show and move draw guides

    this.tool.drawGuideX.visible = true;
    this.tool.drawGuideY.visible = true;
    this.tool.drawGuideZ.visible = true;

    const { x, y, z } = cursorPosition.multiplyScalar(PIXEL_SCALE);
    this.tool.drawGuideX.position.set(0, y, z);
    this.tool.drawGuideY.position.set(x, 0, z);
    this.tool.drawGuideZ.position.set(x, y, 0);

    // Init cursor mesh

    this.tool.cursorMesh.visible = true;
    this.tool.cursorMesh.position.set(x, y, z);
    this.tool.setCursorSize(1, 1, 1);

    this.cursor.start();
  }

  onLeave() {
    // Enable rotation.

    this.canvas.controls.enableRotate = true;

    // Hide meshes.

    this.tool.drawGuideX.visible = false;
    this.tool.drawGuideY.visible = false;
    this.tool.drawGuideZ.visible = false;

    this.cursor.stop();
    this.tool.cursorMesh.visible = false;
  }

  handleMouseUp({ } : CursorEventParams) {
    this.tool.props.color;

    this.dispatchAction(voxelAddBatch([
      Math.min(this.anchor.x, this.target.x),
      Math.min(this.anchor.y, this.target.y),
      Math.min(this.anchor.z, this.target.z),
      Math.max(this.anchor.x, this.target.x),
      Math.max(this.anchor.y, this.target.y),
      Math.max(this.anchor.z, this.target.z),
    ], this.tool.props.color));

    this.transitionTo(STATE_WAIT);
  }

  handleInteract({ } : CursorEventParams) {
    const position = this.cursor.getPosition();
    if (!position) return;

    if (this.target.equals(position)) return;
    this.target.copy(position);

    const displacement = position.sub(this.anchor);

    this.tool.cursorMesh.position.set(
      this.anchor.x + Math.min(displacement.x, 0),
      this.anchor.y + Math.min(displacement.y, 0),
      this.anchor.z + Math.min(displacement.z, 0)
    ).multiplyScalar(PIXEL_SCALE);

    this.tool.setCursorSize(
      Math.abs(displacement.x) + 1,
      Math.abs(displacement.y) + 1,
      Math.abs(displacement.z) + 1
    );
  }
}

interface BrushToolProps {
  color: Color;
}

class BrushTool extends ModelEditorTool<BrushToolProps> {
  canvas: ModelEditorCanvas;

  drawGuideMaterial: THREE.MeshBasicMaterial;
  drawGuideX: THREE.Mesh;
  drawGuideY: THREE.Mesh;
  drawGuideZ: THREE.Mesh;

  cursorColor: THREE.Vector3;
  cursorScale: THREE.Vector3;
  cursorMesh: THREE.Mesh;

  getToolType() { return ToolType.brush; }

  getPropsSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        color: {
          type: SchemaType.ANY,
        },
      },
    };
  }

  mapProps(state: ModelEditorState) {
    return { color: state.common.paletteColor };
  }

  render(diff: BrushToolProps) {
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

    this.drawGuideMaterial = new THREE.MeshBasicMaterial({ visible: false });

    const drawGuideGeometryX = this.createGuideGeometry(DESIGN_IMG_SIZE, 1, 1);
    this.drawGuideX = new THREE.Mesh(drawGuideGeometryX, this.drawGuideMaterial);
    this.drawGuideX.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.drawGuideX.visible = false;

    const drawGuideGeometryY = this.createGuideGeometry(1, DESIGN_IMG_SIZE, 1);
    this.drawGuideY = new THREE.Mesh(drawGuideGeometryY, this.drawGuideMaterial);
    this.drawGuideY.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.drawGuideY.visible = false;

    const drawGuideGeometryZ = this.createGuideGeometry(1, 1, DESIGN_IMG_SIZE);
    this.drawGuideZ = new THREE.Mesh(drawGuideGeometryZ, this.drawGuideMaterial);
    this.drawGuideZ.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.drawGuideZ.visible = false;

    // Setup states

    const wait = new WaitState(this);
    const rotate = new RotateState();
    const draw = new DrawState(this, params.canvas, params.dispatchAction);

    return {
      [STATE_WAIT]: wait,
      [STATE_ROTATE]: rotate,
      [STATE_DRAW]: draw,
    };
  }

  onStart() {
    this.canvas.scene.add(this.cursorMesh);

    this.canvas.scene.add(this.drawGuideX);
    this.canvas.scene.add(this.drawGuideY);
    this.canvas.scene.add(this.drawGuideZ);
  }

  onStop() {
    this.canvas.scene.remove(this.cursorMesh);

    this.canvas.scene.remove(this.drawGuideX);
    this.canvas.scene.remove(this.drawGuideY);
    this.canvas.scene.remove(this.drawGuideZ);
  }

  destroy() {

  }
}

export default BrushTool;
