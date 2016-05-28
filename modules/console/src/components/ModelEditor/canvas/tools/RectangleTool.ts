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
  private _onMouseUp = () => this.transitionTo(STATE_WAIT);
  onEnter() { document.addEventListener('mouseup', this._onMouseUp, false); }
  onLeave() { document.removeEventListener('mouseup', this._onMouseUp, false); }
}

interface DrawEnterParams {
  anchor: THREE.Vector3;
  normal: THREE.Vector3;
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: RectangleTool) {
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
    private tool: RectangleTool,
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
      onMouseUp: params => this.handleMouseUp(params),
      onInteract : params => this.handleInteract(params),
    });

    this.anchor = new THREE.Vector3();
    this.target = new THREE.Vector3();
  }

  onEnter({ anchor, normal }: DrawEnterParams) {
    // Disable rotation.

    this.canvas.controls.enabled = false;

    // Init data

    this.anchor.copy(anchor);
    this.target.copy(this.anchor);

    // Show and move draw guides

    this.tool.drawGuide.visible = true;

    const scaledAnchor = anchor.multiplyScalar(PIXEL_SCALE);
    const absNormal = normal.multiply(normal);

    this.tool.drawGuide.position.copy(absNormal).multiply(scaledAnchor);
    this.tool.drawGuide.scale
      .copy(absNormal).subScalar(1).multiplyScalar(-1)
      .multiplyScalar(DESIGN_IMG_SIZE - 1).addScalar(1)
      .multiplyScalar(PIXEL_SCALE);

    // Init cursor mesh

    this.tool.cursorMesh.visible = true;
    this.tool.cursorMesh.position.copy(scaledAnchor);
    this.tool.setCursorSize(1, 1, 1);

    this.cursor.start();
  }

  onLeave() {
    // Enable rotation.

    this.canvas.controls.enabled = true;

    // Hide meshes.

    this.tool.drawGuide.visible = false;

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

interface RectangleToolProps {
  color: Color;
}

class RectangleTool extends ModelEditorTool<RectangleToolProps> {
  canvas: ModelEditorCanvas;

  drawGuideMaterial: THREE.MeshBasicMaterial;
  drawGuide: THREE.Mesh;

  cursorColor: THREE.Vector3;
  cursorScale: THREE.Vector3;
  cursorMesh: THREE.Mesh;

  getToolType() { return ToolType.rectangle; }

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

  render(diff: RectangleToolProps) {
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
    this.canvas.scene.add(this.drawGuide);
  }

  onStop() {
    this.canvas.scene.remove(this.cursorMesh);
    this.canvas.scene.remove(this.drawGuide);
  }

  destroy() {

  }
}

export default RectangleTool;
