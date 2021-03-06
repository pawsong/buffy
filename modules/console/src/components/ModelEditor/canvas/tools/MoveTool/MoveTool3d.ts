import * as THREE from 'three';
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

const warning = require('fbjs/lib/warning');

import {
  Position,
  ToolType,
  ModelEditorState,
  MaterialMaps,
} from '../../../types';

import {
  MaterialMapType,
} from '../../../../../types';

import {
  voxelCreateFragment,
  voxelSelectConnected,
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

interface MoveTool3dProps {
  size: Position;
  selection: ndarray.Ndarray;
  fragment: MaterialMaps;
  fragmentOffset: Position;
}

interface MoveTool3dTree {
  selection: ndarray.Ndarray;
  fragment: MaterialMaps;
  fragmentOffset: Position;
}

class MoveTool3d extends ModelEditorTool<MoveTool3dProps, void, MoveTool3dTree> {
  translucentMaterial: THREE.Material;

  arrowX: THREE.ArrowHelper;
  arrowY: THREE.ArrowHelper;
  arrowZ: THREE.ArrowHelper;

  temp1: THREE.Vector3;
  temp2: THREE.Vector3;
  temp3: THREE.Vector3;
  temp4: THREE.Vector3;

  arrowScene: THREE.Scene;

  private activeArrow: THREE.Object3D;
  private materialsToRestore: MaterialToRestore[];

  drawGuide: THREE.Mesh;
  drawGuideSize: THREE.Vector3;

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
      this.arrowX.visible = true;
      this.arrowY.visible = true;
      this.arrowZ.visible = true;

      this.arrowX.position.copy(boundingBox.edges.position);
      this.arrowY.position.copy(boundingBox.edges.position);
      this.arrowZ.position.copy(boundingBox.edges.position);
    } else {
      this.arrowX.visible = false;
      this.arrowY.visible = false;
      this.arrowZ.visible = false;
    }
  }

  render() {
    return this.props;
  }

  patch(diff: MoveTool3dTree) {
    // Fragment has precedence over selection.
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
    this.drawGuideSize = new THREE.Vector3(1, 1, 1);

    this.activeArrow = null;
    this.materialsToRestore = [];

    this.translucentMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    const drawGuideGeometry = new THREE.BoxGeometry(1, 1, 1);
    const drawGuideMaterial = new THREE.MeshBasicMaterial();
    this.drawGuide = new THREE.Mesh(drawGuideGeometry, drawGuideMaterial);

    // // For debugging
    // drawGuideMaterial.color.setHex(0xff0000);
    // drawGuideMaterial.opacity = 0.5;
    // drawGuideMaterial.transparent = true;
    // this.canvas.scene.add(this.drawGuide);

    const origin = new THREE.Vector3(0, 0, 0); // Has no meaning.

    const unitX = new THREE.Vector3(1, 0, 0);
    const unitY = new THREE.Vector3(0, 1, 0);
    const unitZ = new THREE.Vector3(0, 0, 1);

    this.arrowX = new THREE.ArrowHelper(unitX, origin, length, 0xF44336);
    this.arrowY = new THREE.ArrowHelper(unitY, origin, length, 0x4CAF50);
    this.arrowZ = new THREE.ArrowHelper(unitZ, origin, length, 0x2196F3);

    this.arrowX.setLength(2, 1, 0.5);
    this.arrowY.setLength(2, 1, 0.5);
    this.arrowZ.setLength(2, 1, 0.5);

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

  activateArrow(arrow: THREE.Object3D) {
    if (this.activeArrow === arrow) return;

    this.deactivateArrow();

    this.activeArrow = arrow;

    this.materialsToRestore = arrow.children.map(child => {
      const material = <THREE.MeshBasicMaterial>(<THREE.Line | THREE.Mesh>child).material;
      const color = material.color.getHex();
      material.color.setRGB(1, 1, 1);
      return { material, color };
    });
  }

  deactivateArrow() {
    if (!this.activeArrow) return;

    this.materialsToRestore.forEach(data => data.material.color.setHex(data.color));
    this.materialsToRestore = [];
    this.activeArrow = null;
  }

  getDirection(v: THREE.Vector3) {
    if (this.activeArrow === this.arrowX) {
      v.set(1, 0, 0);
    } else if (this.activeArrow === this.arrowY) {
      v.set(0, 1, 0);
    } else if (this.activeArrow === this.arrowZ) {
      v.set(0, 0, 1);
    }
  }

  private getScaleForCamera() {
    return 100 / this.canvas.getCameraZoom();
  }

  private updateArrowScale(scale: number) {
    this.arrowX.scale.set(scale, scale, scale);
    this.arrowY.scale.set(scale, scale, scale);
    this.arrowZ.scale.set(scale, scale, scale);
  }

  private updateDrawGuideScale(scale: number) {
    this.drawGuide.scale.copy(this.drawGuideSize).multiplyScalar(scale);
    this.drawGuide.updateMatrixWorld(false);
  }

  updateDrawGuide(direction: THREE.Vector3) {
    const { position } = this.canvas.component.fragmentBoundingBox.edges;

    this.drawGuideSize.copy(direction).multiplyScalar(20 - 1).addScalar(1);
    this.drawGuide.position.copy(position);

    this.updateDrawGuideScale(this.getScaleForCamera());
  }

  onCameraMove() {
    const scale = this.getScaleForCamera();
    this.updateArrowScale(scale);
    if (this.fsm.current instanceof DragState) this.updateDrawGuideScale(scale);
  }

  onStart() {
    this.onCameraMove();
  }

  /*
   * Don't be confused with render() function.
   * This is just a callback called after canvas.render() call.
   */
  onRender() {
    this.canvas.renderer.clearDepth();
    this.canvas.renderer.render(this.arrowScene, this.canvas.camera);
  }

  onDestroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  materialsToRestore: MaterialToRestore[];
  activeMeshes: THREE.Mesh[];

  constructor(private tool: MoveTool3d) {
    super();
    this.materialsToRestore = [];
    this.activeMeshes = [];

    const offset = new THREE.Vector3();

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      cursorOnFace: false,
      intersectRecursively: true,
      getInteractables: () => [
        tool.arrowX,
        tool.arrowY,
        tool.arrowZ,
        tool.canvas.component.modelMesh,
      ],
      determineIntersect: intersects => {
        for (let i = 0, len = intersects.length; i < len; ++i) {
          const intersect = intersects[i];
          if (intersect.object !== tool.canvas.component.modelMesh) return intersect;
        }
        return intersects[0];
      },
      onHit: params => this.handleHit(params),
      onMiss: () => this.handleMiss(),
      onMouseDown: params => this.handleMouseDown(params),
      onMouseUp: (params) => this.handleMouseUp(params),
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
      this.tool.activateArrow(intersect.object.parent);
    }
  }

  private handleMouseDown({ event, intersect }: CursorEventParams) {
    if (intersect && intersect.object !== this.tool.canvas.component.modelMesh) {
      this.transitionTo(STATE_DRAG, event);
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
          voxelSelectConnected(position.x, position.y, position.z, mergeSelection)
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

class DragState extends ToolState {
  cursor: Cursor;

  private direction: THREE.Vector3;
  private origin: THREE.Vector3;
  private target: THREE.Vector3;

  private temp1: THREE.Vector3;
  private temp2: THREE.Vector3;

  constructor(private tool: MoveTool3d) {
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
      onHit: () => this.handleHit(),
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
    this.tool.updateDrawGuide(this.direction);

    this.cursor.start();

    this.cursor.getPositionFromMouseEvent(event, this.origin);
    this.target.copy(this.origin);
  }

  private handleHit() {
    const position = this.cursor.getPosition();

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
    this.tool.drawGuide.position.copy(this.tool.canvas.component.fragmentBoundingBox.edges.position);
    this.tool.drawGuide.updateMatrixWorld(false);
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
        null,
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

export default MoveTool3d;
