import * as THREE from 'three';
import * as Immutable from 'immutable';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';
import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState,
} from './ModelEditorTool';

import ModelEditorCanvas from '../ModelEditorCanvas';
import { SetState } from '../types';

import {
  Position,
  ToolType,
  DispatchAction,
} from '../../types';

import {
  voxelMaginWand,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';
const STATE_ROTATE = 'rotate';

class RotateState extends ToolState {
  handleMouseUp = () => this.transitionTo(STATE_WAIT)
  onEnter() { document.addEventListener('mouseup', this.handleMouseUp, false); }
  onLeave() { document.removeEventListener('mouseup', this.handleMouseUp, false); }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(
    private tool: MagicWandTool,
    private canvas: ModelEditorCanvas
  ) {
    super();
    const offset = new THREE.Vector3();

    this.cursor = new Cursor(canvas, {
      getInteractables: () => [this.canvas.component.modelMesh],
      geometry: this.canvas.cubeGeometry,
      material: this.tool.translucentMaterial,
      getOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      onMouseDown: params => this.handleMouseDown(params),
    });
  }

  onEnter(event?: MouseEvent) {
    this.cursor.start(event);
  }

  handleMouseDown({ event, intersect }: CursorEventParams) {
    if (intersect) {
      this.transitionTo(STATE_DRAG, event);
    } else {
      this.transitionTo(STATE_ROTATE);
    }
  }

  onLeave() {
    this.cursor.stop();
  }
}

class DragState extends ToolState {
  cursor: Cursor;

  private position: THREE.Vector3;

  constructor(
    private tool: MagicWandTool,
    private canvas: ModelEditorCanvas,
    private dispatchAction: DispatchAction
  ) {
    super();
    this.position = new THREE.Vector3();

    const offset = new THREE.Vector3();

    this.cursor = new Cursor(canvas, {
      geometry: this.canvas.cubeGeometry,
      material: this.tool.translucentMaterial,
      getOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      getInteractables: () => [this.canvas.component.modelMesh],
      onMouseUp: params => this.handleMouseUp(params),
    });
  }

  onEnter(event: MouseEvent) {
    this.canvas.controls.enableRotate = false;
    this.cursor.start(event);
  }

  handleMouseUp({ event }: CursorEventParams) {
    const position = this.cursor.getPosition();

    if (position) {
      this.dispatchAction(voxelMaginWand(position.x, position.y, position.z));
    }

    this.transitionTo(STATE_WAIT, event);
  }

  onLeave() {
    this.canvas.controls.enableRotate = true;
    this.cursor.stop();
  }
}

class MagicWandTool extends ModelEditorTool<void> {
  translucentMaterial: THREE.Material;

  getToolType(): ToolType { return ToolType.MAGIC_WAND; }

  init(params: InitParams) {
    this.translucentMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    const wait = new WaitState(this, params.canvas);
    const rotate = new RotateState();
    const drag = new DragState(this, params.canvas, params.dispatchAction);

    return {
      [STATE_WAIT]: wait,
      [STATE_DRAG]: drag,
      [STATE_ROTATE]: rotate,
    };
  }

  destroy() {

  }
}

export default MagicWandTool;
