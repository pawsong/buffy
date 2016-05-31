import * as THREE from 'three';
import * as Immutable from 'immutable';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';

import { createGeometryFromMesh } from '../../../../canvas/utils';
import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';
import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import BoundingBoxEdgesHelper from '../objects/BoundingBoxEdgesHelper';

const fragmentVertexShader = require('raw!../shaders/fragment.vert');
const fragmentFragmentShader = require('raw!../shaders/fragment.frag');

import {
  Position,
  ToolType,
  ModelEditorState,
} from '../../types';

import {
  voxelCreateFragment,
  voxelSelectConnected,
  voxelMoveFragment,
  voxelMergeFragment,
  voxelClearSelection,
} from '../../actions';

import * as ndarray from 'ndarray';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';

interface MaterialToRestore {
  material: THREE.MeshBasicMaterial;
  color: number;
}

interface MoveToolProps {
  size: Position;
  selection: ndarray.Ndarray;
  fragment: ndarray.Ndarray;
  fragmentOffset: Position;
}

interface MoveToolTree {
  selection: ndarray.Ndarray;
  fragment: ndarray.Ndarray;
  fragmentOffset: Position;
}

class MoveTool extends ModelEditorTool<MoveToolProps, void, MoveToolTree> {
  translucentMaterial: THREE.Material;

  arrowX: THREE.ArrowHelper;
  arrowY: THREE.ArrowHelper;
  arrowZ: THREE.ArrowHelper;

  temp1: THREE.Vector3;
  temp2: THREE.Vector3;
  temp3: THREE.Vector3;
  temp4: THREE.Vector3;

  arrowScene: THREE.Scene;

  private activeCone: THREE.Object3D;
  private materialsToRestore: MaterialToRestore[];

  drawGuide: THREE.Mesh;

  getToolType(): ToolType { return ToolType.MOVE; }

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

  updateArrow(boundingBox: BoundingBoxEdgesHelper) {
    if (boundingBox && boundingBox.edges.visible) {
      boundingBox.box.size(this.temp1);

      this.arrowX.visible = true;
      this.arrowX.position.copy(boundingBox.edges.position);
      this.arrowX.setLength(this.temp1.x / 2 + 3 * PIXEL_SCALE, 2 * PIXEL_SCALE, PIXEL_SCALE);

      this.arrowY.visible = true;
      this.arrowY.position.copy(boundingBox.edges.position);
      this.arrowY.setLength(this.temp1.y / 2 + 3 * PIXEL_SCALE, 2 * PIXEL_SCALE, PIXEL_SCALE);

      this.arrowZ.visible = true;
      this.arrowZ.position.copy(boundingBox.edges.position);
      this.arrowZ.setLength(this.temp1.z / 2 + 3 * PIXEL_SCALE, 2 * PIXEL_SCALE, PIXEL_SCALE);
    } else {
      this.arrowX.visible = false;
      this.arrowY.visible = false;
      this.arrowZ.visible = false;
    }
  }

  render() {
    return this.props;
  }

  patch(diff: MoveToolTree) {
    // Fragment has precedence over selection.
    // Selection must not exist when fragment does.

    if (diff.selection && this.tree.fragment) {
      // This should not occur.
      return;
    }

    if (this.tree.fragment) {
      this.updateArrow(this.canvas.component.fragmentBoundingBox);
    } else if (this.tree.selection) {
      this.updateArrow(this.canvas.component.selectionBoundingBox);
    } else {
      this.updateArrow(null);
    }
  }

  onInit(params: InitParams) {
    super.onInit(params);

    this.temp1 = new THREE.Vector3();
    this.temp2 = new THREE.Vector3();
    this.temp3 = new THREE.Vector3();
    this.temp4 = new THREE.Vector3();

    this.activeCone = null;
    this.materialsToRestore = [];

    this.translucentMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    const drawGuideGeometry = new THREE.BoxGeometry(1, 1, 1);
    const drawGuideMaterial = new THREE.MeshBasicMaterial({
      visible: false,
      // color: 0x00ff00,
      // opacity: 0.5,
      // transparent: true,
    });
    this.drawGuide = new THREE.Mesh(drawGuideGeometry, drawGuideMaterial);

    const origin = new THREE.Vector3(0, 0, 0); // Has no meaning.

    const unitX = new THREE.Vector3(1, 0, 0);
    const unitY = new THREE.Vector3(0, 1, 0);
    const unitZ = new THREE.Vector3(0, 0, 1);

    this.arrowX = new THREE.ArrowHelper(unitX, origin, length, 0xF44336);
    this.arrowY = new THREE.ArrowHelper(unitY, origin, length, 0x4CAF50);
    this.arrowZ = new THREE.ArrowHelper(unitZ, origin, length, 0x2196F3);

    this.arrowScene = new THREE.Scene();
    this.arrowScene.add(this.arrowX);
    this.arrowScene.add(this.arrowY);
    this.arrowScene.add(this.arrowZ);
  }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAG]: new DragState(this),
    };
  }

  activateArrow(cone: THREE.Object3D) {
    if (this.activeCone === cone) return;

    this.deactivateArrow();

    this.activeCone = cone;

    this.materialsToRestore = cone.parent.children.map(child => {
      const material = <THREE.MeshBasicMaterial>(<THREE.Line | THREE.Mesh>child).material;
      const color = material.color.getHex();
      material.color.setRGB(1, 1, 1);
      return { material, color };
    });
  }

  deactivateArrow() {
    if (!this.activeCone) return;

    this.materialsToRestore.forEach(data => data.material.color.setHex(data.color));
    this.materialsToRestore = [];
    this.activeCone = null;
  }

  getDirection(v: THREE.Vector3) {
    if (this.activeCone === this.arrowX.cone) {
      v.set(1, 0, 0);
    } else if (this.activeCone === this.arrowY.cone) {
      v.set(0, 1, 0);
    } else if (this.activeCone === this.arrowZ.cone) {
      v.set(0, 0, 1);
    }
  }

  updateDrawGuide(direction: THREE.Vector3, boundingBox: BoundingBoxEdgesHelper) {
    boundingBox.box.size(this.temp1);
    const { position } = boundingBox.edges;

    this.temp4.set(this.props.size[0], this.props.size[0], this.props.size[0]);

    this.temp2.copy(direction).subScalar(1).multiplyScalar(-1);

    this.drawGuide.scale.copy(this.temp1).multiply(this.temp2)
      .add(this.temp3.copy(direction).multiply(this.temp4).multiplyScalar(PIXEL_SCALE * 4));
    this.drawGuide.position.copy(position).multiply(this.temp2)
      .add(this.temp3.copy(direction).multiply(this.temp4).multiplyScalar(PIXEL_SCALE_HALF));

    this.drawGuide.updateMatrixWorld(false);
  }

  onStart() {
    super.onStart();
    this.canvas.scene.add(this.drawGuide);
  }

  /*
   * Don't be confused with render() function.
   * This is just a callback called after canvas.render() call.
   */
  onRender() {
    this.canvas.renderer.clearDepth();
    this.canvas.renderer.render(this.arrowScene, this.canvas.camera);
  }

  onStop() {
    super.onStop();
    this.canvas.scene.remove(this.drawGuide);
  }

  onDestroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  materialsToRestore: MaterialToRestore[];
  activeMeshes: THREE.Mesh[];

  constructor(private tool: MoveTool) {
    super();
    this.materialsToRestore = [];
    this.activeMeshes = [];

    const offset = new THREE.Vector3();

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      cursorOnFace: false,
      getInteractables: () => [
        tool.arrowX.cone,
        tool.arrowY.cone,
        tool.arrowZ.cone,
        tool.canvas.component.modelMesh,
      ],
      determineIntersect: intersects => {
        for (let i = 0, len = intersects.length; i < len; ++i) {
          const intersect = intersects[i];
          if (intersect.object !== tool.canvas.component.modelMesh) {
            return intersect;
          }
        }
        return intersects[0];
      },
      onHit: params => this.handleHit(params),
      onMiss: () => this.handleMiss(),
      onMouseDown: params => this.handleMouseDown(params),
    });
  }

  onEnter(event?: MouseEvent) {
    this.cursor.start(event);
  }

  private handleMiss() {
    this.tool.deactivateArrow();
  }

  private handleHit({ intersect }: CursorEventParams) {
    if (intersect.object === this.tool.canvas.component.modelMesh) {
      this.tool.deactivateArrow();
    } else {
      this.tool.activateArrow(intersect.object);
    }
  }

  private handleMouseDown({ event, intersect }: CursorEventParams) {
    if (!intersect) {
      if (this.tool.props.fragment) {
        this.tool.dispatchAction(voxelMergeFragment());
      } else if (this.tool.props.selection) {
        this.tool.dispatchAction(voxelClearSelection());
      }
    } else if (intersect.object === this.tool.canvas.component.modelMesh) {
      if (this.tool.props.fragment) {
        this.tool.dispatchAction(voxelMergeFragment());
      } else {
        const position = this.cursor.getPosition();
        this.tool.dispatchAction(
          voxelSelectConnected(position.x, position.y, position.z, this.tool.keyboard.isShiftPressed())
        );
      }
    } else {
      this.transitionTo(STATE_DRAG, event);
    }
  }

  onLeave() {
    this.cursor.stop();
  }
}

class DragState extends ToolState {
  cursor: Cursor;

  private direction: THREE.Vector3;
  private origin: THREE.Vector3;
  private target: THREE.Vector3;

  private temp1: THREE.Vector3;
  private temp2: THREE.Vector3;

  constructor(private tool: MoveTool) {
    super();
    this.direction = new THREE.Vector3();
    this.origin = new THREE.Vector3();
    this.target = new THREE.Vector3();

    this.temp1 = new THREE.Vector3();
    this.temp2 = new THREE.Vector3();

    const offset = new THREE.Vector3();

    const intersectables = [this.tool.drawGuide];

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      getInteractables: () => intersectables,
      onHit: params => this.handleHit(params),
      onMouseUp: () => this.handleMouseUp(),
    });
  }

  onEnter(event: MouseEvent) {
    const boundingBox = this.tool.canvas.component.fragmentBoundingBox;

    if (!this.tool.props.fragment) {
      this.tool.canvas.component.setTemporaryFragment();
      this.tool.updateArrow(boundingBox);
    }

    this.tool.getDirection(this.direction);
    this.tool.updateDrawGuide(this.direction, boundingBox);

    this.cursor.start();

    this.cursor.getPositionFromMouseEvent(event, this.origin);
    this.target.copy(this.origin);
  }

  private handleHit(params: CursorEventParams) {
    const position = this.cursor.getPosition();
    if (!position) return;

    if (this.target.equals(position)) return;
    this.target.copy(position);

    const offset = this.tool.props.fragmentOffset;
    this.temp1.set(offset[0], offset[1], offset[2]);

    this.tool.canvas.component.moveFragmentMesh(
      this.temp2
        .subVectors(this.target, this.origin)
        .multiply(this.direction)
        .add(this.temp1)
    );
    this.tool.updateArrow(this.tool.canvas.component.fragmentBoundingBox);
  }

  private handleMouseUp() {
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

export default MoveTool;
