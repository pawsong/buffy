import * as THREE from 'three';
import * as ndarray from 'ndarray';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  Position,
  Color,
  ToolType,
  ModelEditorState,
} from '../../types';

import {
  voxelAddBatch,
  voxelMergeFragment,
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

interface BrushToolProps {
  color: Color;
  fragment: ndarray.Ndarray;
}

interface BrushToolTree {
  color: Color;
}

class BrushTool extends ModelEditorTool<BrushToolProps, void, BrushToolTree> {
  cursorMesh: THREE.Mesh;
  drawGuideX: THREE.Mesh;
  drawGuideY: THREE.Mesh;
  drawGuideZ: THREE.Mesh;

  private cursorColor: THREE.Vector3;
  private cursorScale: THREE.Vector3;

  getToolType() { return ToolType.BRUSH; }

  /*
   * Component methods
   */

  mapParamsToProps(state: ModelEditorState) {
    return {
      color: state.common.paletteColor,
      fragment: state.file.present.data.fragment,
    };
  }

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        color: { type: SchemaType.ANY },
      },
    };
  }

  render() {
    return this.props;
  }

  patch(diff: BrushToolProps) {
    this.setCursorColor(diff.color || this.props.color);
  }

  /*
   * Custom methods
   */

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

  /*
   * States
   */

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAW]: new DrawState(this),
    };
  }

  /*
   * Lifecycle methods
   */

  onInit(params: InitParams) {
    super.onInit(params);

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

    const drawGuideMaterial = new THREE.MeshBasicMaterial({ visible: false });

    const drawGuideGeometryX = this.createGuideGeometry(DESIGN_IMG_SIZE, 1, 1);
    this.drawGuideX = new THREE.Mesh(drawGuideGeometryX, drawGuideMaterial);
    this.drawGuideX.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);

    const drawGuideGeometryY = this.createGuideGeometry(1, DESIGN_IMG_SIZE, 1);
    this.drawGuideY = new THREE.Mesh(drawGuideGeometryY, drawGuideMaterial);
    this.drawGuideY.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);

    const drawGuideGeometryZ = this.createGuideGeometry(1, 1, DESIGN_IMG_SIZE);
    this.drawGuideZ = new THREE.Mesh(drawGuideGeometryZ, drawGuideMaterial);
    this.drawGuideZ.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
  }

  onStart() {
    this.canvas.scene.add(this.cursorMesh);
  }

  onStop() {
    this.canvas.scene.remove(this.cursorMesh);
  }

  onDestroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: BrushTool) {
    super();

    const position = new THREE.Vector3();

    this.cursor = new Cursor(tool.canvas, {
      mesh: tool.cursorMesh,
      offset: [0, 0, 0],
      getInteractables: () => [
        this.tool.canvas.plane,
        this.tool.canvas.component.modelMesh,
        this.tool.canvas.component.fragmentMesh,
      ],
      hitTest: (intersect, meshPosition) => {
        Cursor.getDataPosition(meshPosition, position);
        return (
             position.x >= 0 && position.x < DESIGN_IMG_SIZE
          && position.y >= 0 && position.y < DESIGN_IMG_SIZE
          && position.z >= 0 && position.z < DESIGN_IMG_SIZE
        );
      },
      onMouseDown: params => this.handleMouseDown(params),
    });
  }

  handleMouseDown({ event, intersect }: CursorEventParams) {
    if (this.tool.props.fragment) this.tool.dispatchAction(voxelMergeFragment());

    const position = this.cursor.getPosition();
    if (position) this.transitionTo(STATE_DRAW, position);
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

  constructor(private tool: BrushTool) {
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
      onHit: params => this.handleHit(params),
    });

    this.anchor = new THREE.Vector3();
    this.target = new THREE.Vector3();
  }

  onEnter(cursorPosition: THREE.Vector3) {
    // Init data

    this.anchor.copy(cursorPosition);
    this.target.copy(this.anchor);

    // Show and move draw guides
    const { x, y, z } = cursorPosition.multiplyScalar(PIXEL_SCALE);
    this.tool.drawGuideX.position.set(0, y, z);
    this.tool.drawGuideY.position.set(x, 0, z);
    this.tool.drawGuideZ.position.set(x, y, 0);

    this.tool.drawGuideX.updateMatrixWorld(false);
    this.tool.drawGuideY.updateMatrixWorld(false);
    this.tool.drawGuideZ.updateMatrixWorld(false);

    // Init cursor mesh

    this.tool.cursorMesh.visible = true;
    this.tool.cursorMesh.position.set(x, y, z);
    this.tool.setCursorSize(1, 1, 1);

    this.cursor.start();
  }

  onLeave() {
    // Hide meshes.
    this.cursor.stop();
    this.tool.cursorMesh.visible = false;
  }

  handleMouseUp({ } : CursorEventParams) {
    this.tool.dispatchAction(voxelAddBatch([
      Math.min(this.anchor.x, this.target.x),
      Math.min(this.anchor.y, this.target.y),
      Math.min(this.anchor.z, this.target.z),
      Math.max(this.anchor.x, this.target.x),
      Math.max(this.anchor.y, this.target.y),
      Math.max(this.anchor.z, this.target.z),
    ], this.tool.props.color));

    this.transitionTo(STATE_WAIT);
  }

  handleHit({ } : CursorEventParams) {
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

export default BrushTool;
