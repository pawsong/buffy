import THREE from 'three';
import * as Immutable from 'immutable';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';
import * as ndarray from 'ndarray';

import { createGeometryFromMesh } from '../../../../../canvas/utils';
import Cursor, { CursorEventParams } from '../../../../../canvas/Cursor';
import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from '../ModelEditorTool';

import BoundingBoxEdgesHelper from '../../objects/BoundingBoxEdgesHelper';

const fragmentVertexShader = require('raw!../../shaders/fragment.vert');
const fragmentFragmentShader = require('raw!../../shaders/fragment.frag');

const warning = require('fbjs/lib/warning');

import {
  Position,
  ToolType,
  ModelEditorState,
} from '../../../types';

import {
  voxelCreateFragment,
  voxelSelectConnected2d,
  voxelMoveFragment,
  voxelMergeFragment,
  voxelClearSelection,
} from '../../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';

const DRAW_GUIDE_SCALE = 10;

interface MaterialToRestore {
  material: THREE.MeshBasicMaterial;
  color: number;
}

interface MoveTool2dProps {
  size: Position;
  selection: ndarray.Ndarray;
  fragment: ndarray.Ndarray;
  fragmentOffset: Position;
}

interface MoveTool2dTree {
  selection: ndarray.Ndarray;
  fragment: ndarray.Ndarray;
  fragmentOffset: Position;
}

class MoveTool2d extends ModelEditorTool<MoveTool2dProps, void, MoveTool2dTree> {
  temp1: THREE.Vector3;
  temp2: THREE.Vector3;
  temp3: THREE.Vector3;
  temp4: THREE.Vector3;

  drawGuide: THREE.Mesh;
  drawGuideSize: THREE.Vector3;

  getToolType(): ToolType { return ToolType.MOVE_3D; }

  mapParamsToProps(params: ModelEditorState) {
    return {
      size: params.file.present.data.size,
      selection: params.file.present.data.selection,
      fragment: params.file.present.data.fragment,
      fragmentOffset: params.file.present.data.fragmentOffset,
    };
  }

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        selection: { type: SchemaType.ANY },
        fragment: { type: SchemaType.ANY },
        fragmentOffset: { type: SchemaType.ANY },
      }
    };
  }

  onInit(params: InitParams) {
    super.onInit(params);

    this.temp1 = new THREE.Vector3();
    this.temp2 = new THREE.Vector3();
    this.temp3 = new THREE.Vector3();
    this.temp4 = new THREE.Vector3();
    this.drawGuideSize = new THREE.Vector3(1, 1, 1);

    const drawGuideGeometry = new THREE.BoxGeometry(1, 1, 1);
    drawGuideGeometry.translate(1 / 2, 1 / 2, 1 / 2);

    const drawGuideMaterial = new THREE.MeshBasicMaterial();
    this.drawGuide = new THREE.Mesh(drawGuideGeometry, drawGuideMaterial);

    // // For debugging
    // drawGuideMaterial.color.setHex(0xff0000);
    // drawGuideMaterial.opacity = 0.5;
    // drawGuideMaterial.transparent = true;
    // this.canvas.scene.add(this.drawGuide);
  }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAG]: new DragState(this),
    };
  }

  onStart() {
    this.onCameraMove();
  }

  onDestroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: MoveTool2d) {
    super();

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      cursorOnFace: false,
      intersectRecursively: true,
      getInteractables: () => [
        // Order is important!
        tool.canvas.component.fragmentSliceMesh,
        tool.canvas.component.selectionSliceMesh,
        tool.canvas.component.model2DSliceMesh,
      ],
      onMouseDown: params => this.handleMouseDown(params),
      onMouseUp: (params) => this.handleMouseUp(params),
    });
  }

  onEnter(event?: MouseEvent) {
    this.cursor.start(event);
  }

  private handleMouseDown({ event, intersect }: CursorEventParams) {
    if (!intersect) return;

    if (intersect.object === this.tool.canvas.component.selectionSliceMesh) {
      this.tool.canvas.component.setTemporaryFragmentSlice();
      this.transitionTo(STATE_DRAG, <EnterParams>{ event, position: this.cursor.getPosition() });
    } else if (intersect.object === this.tool.canvas.component.fragmentSliceMesh) {
      this.transitionTo(STATE_DRAG, <EnterParams>{ event, position: this.cursor.getPosition() });
    }
  }

  private handleMouseUp({ intersect }: CursorEventParams) {
    if (this.tool.props.fragment) {
      this.tool.dispatchAction(voxelMergeFragment());
    } else {
      const mergeSelection = this.tool.keyboard.isShiftPressed();

      if (intersect) {
        const position = this.cursor.getPosition();
        this.tool.dispatchAction(
          voxelSelectConnected2d(position.x, position.y, position.z, mergeSelection)
        );
      } else {
        if (this.tool.props.selection && !mergeSelection) {
          this.tool.dispatchAction(voxelClearSelection());
        }
      }
    }
  }

  onLeave() {
    this.cursor.stop();
  }
}

interface EnterParams {
  event: MouseEvent;
  position: THREE.Vector3;
}

class DragState extends ToolState {
  cursor: Cursor;

  // private direction: THREE.Vector3;
  private anchor: THREE.Vector3;
  private target: THREE.Vector3;

  private temp1: THREE.Vector3;
  private temp2: THREE.Vector3;
  private temp3: THREE.Vector3;

  constructor(private tool: MoveTool2d) {
    super();
    // this.direction = new THREE.Vector3();
    this.anchor = new THREE.Vector3();
    this.target = new THREE.Vector3();

    this.temp1 = new THREE.Vector3();
    this.temp2 = new THREE.Vector3();
    this.temp3 = new THREE.Vector3();

    // const offset = new THREE.Vector3();

    const intersectables = [this.tool.drawGuide];

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      cursorOnFace: false,
      getInteractables: () => intersectables,
      onHit: this.handleHit,
      onMouseUp: this.handleMouseUp,
    });
  }

  onEnter(params: EnterParams) {
    const { normal } = this.tool.canvas.component.mode2DClippingPlane;
    const { size } = this.tool.props;

    // Update guides
    const absNormal = this.temp1.copy(normal).multiply(normal);
    const projection = this.temp2.copy(absNormal).subScalar(1).multiplyScalar(-1);

    this.tool.drawGuide.scale
      .copy(projection)
      .multiply(this.temp3.set(size[0], size[1], size[2]))
      .multiplyScalar(DRAW_GUIDE_SCALE)
      .add(absNormal)
      .multiplyScalar(PIXEL_SCALE);

    this.tool.drawGuide.position
      .copy(absNormal).multiply(params.position).multiplyScalar(PIXEL_SCALE)
      .sub(
        this.temp3.copy(this.tool.drawGuide.scale)
          .multiply(projection)
          .multiplyScalar((DRAW_GUIDE_SCALE - 1) / DRAW_GUIDE_SCALE / 2)
      );

    this.tool.drawGuide.updateMatrixWorld(false);
    this.cursor.start();

    this.cursor.getPositionFromMouseEvent(params.event, this.anchor);
    this.target.copy(this.anchor);
  }

  private handleHit = () => {
    const position = this.cursor.getPosition();

    if (this.target.equals(position)) return;
    this.target.copy(position);

    const offset = this.tool.props.fragmentOffset;
    this.temp1.set(offset[0], offset[1], offset[2]);

    this.tool.canvas.component.moveFragmentMesh(
      this.temp2
        .subVectors(this.target, this.anchor)
        .add(this.temp1)
    );
  }

  private handleMouseUp = () => {
    if (this.tool.props.fragment) {
      // Update fragment position.
      this.tool.canvas.component.getFragmentPosition(this.temp1);
      this.tool.dispatchAction(voxelMoveFragment(this.temp1.x, this.temp1.y, this.temp1.z));
    } else {
      // Create fragment from selection with current view offset.
      this.tool.canvas.component.getFragmentPosition(this.temp1);
      this.tool.dispatchAction(voxelCreateFragment(
        this.tool.canvas.component.tree.model,
        this.tool.canvas.component.tree.fragment,
        this.temp1.x, this.temp1.y, this.temp1.z
      ));
    }

    this.transitionTo(STATE_WAIT, event);
  }

  onLeave() {
    this.cursor.stop();
  }
}

export default MoveTool2d;
