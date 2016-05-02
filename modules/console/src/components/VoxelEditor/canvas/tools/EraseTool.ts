import * as THREE from 'three';
import * as Immutable from 'immutable';

import VoxelEditorTool, {
  InitParams,
  HandlerResult,
  VoxelEditorToolState,
  VoxelEditorToolStates,
  InteractParams,
  MouseUpParams,
  MouseDownParams,
} from './VoxelEditorTool';

import View from '../views/main';
import { SetState } from '../types';

import {
  Position,
  ToolType,
  DispatchAction,
} from '../../interface';

import Voxel, { VoxelMesh } from '../Voxel';

import {
  voxelRemoveBatch,
} from '../../voxels/actions';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../../constants/Pixels';

import {
  toAbsPos,
  toScreenPos,
} from '../utils';

const cube = new THREE.CubeGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
const cubeMaterial = new THREE.MeshBasicMaterial({
  vertexColors: THREE.VertexColors,
  opacity: 0.5,
  transparent: true,
  polygonOffset: true,
  polygonOffsetFactor: -0.1,
});

const STATE_WAIT = VoxelEditorToolState.STATE_WAIT;
const STATE_DRAG = 'drag';
const STATE_ROTATE = 'rotate';

interface RotateStateProps {

}

class RotateState extends VoxelEditorToolState<RotateStateProps> {
  onMouseUp(): HandlerResult {
    return { state: STATE_WAIT };
  }
  render() {}
}

interface WaitStateProps {

}

class WaitState extends VoxelEditorToolState<WaitStateProps> {
  constructor(
    private tool: EraseTool
  ) {
    super();
  }

  render() {}

  isIntersectable(object) {
    return object.isVoxel;
  }

  onMouseDown({ intersect }: MouseDownParams): HandlerResult {
    if (intersect) {
      return { state: STATE_DRAG, params: intersect };
    } else {
      return { state: STATE_ROTATE };
    }
  }

  onInteract({ intersect }: InteractParams) {
    this.tool.cursor.hide();

    if (!intersect) return;
    if (!intersect.object['isVoxel']) return;

    const normal = intersect.face.normal;
    const position = new THREE.Vector3().subVectors( intersect.point, normal )

    this.tool.cursor.move({
      x: Math.floor( position.x / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
      y: Math.floor( position.y / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
      z: Math.floor( position.z / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
    });
  }

  onLeave() {
    this.tool.cursor.hide();
  }
}

interface DragStateProps {

}

class DragState extends VoxelEditorToolState<DragStateProps> {
  selected: Immutable.Map<Immutable.Iterable.Indexed<number>, { mesh: THREE.Mesh, position: Position }>;

  constructor(
    private view: View,
    private dispatchAction: DispatchAction
  ) { super(); }

  render() {}

  isIntersectable(object) {
    return object.isVoxel;
  }

  onEnter(intersect: THREE.Intersection): HandlerResult {
    this.view.controls.enableRotate = false;
    this.selected = Immutable.Map<any, any>();
    this.handleInteract(intersect);
  }

  onInteract({ intersect }: InteractParams) {
    this.handleInteract(intersect);
  }

  onMouseUp({ intersect }: MouseUpParams) {
    const positions = this.selected.toArray().map(({ position }) => position);
    this.dispatchAction(voxelRemoveBatch(positions));
    return { state: STATE_WAIT };
  }

  onLeave() {
    this.view.controls.enableRotate = true;
    this.selected.forEach(({ mesh }) => this.view.scene.remove(mesh));
    this.selected = Immutable.Map<any, any>();
  }

  handleInteract(intersect: THREE.Intersection) {
    if (!intersect) return;
    if (!intersect.object['isVoxel']) return;

    const normal = intersect.face.normal;
    const position = new THREE.Vector3().subVectors(intersect.point, normal);

    const screenPos: Position = [
      Math.floor( position.x / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
      Math.floor( position.y / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
      Math.floor( position.z / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
    ];

    const key = Immutable.Iterable(screenPos);

    if (this.selected.has(key)) return;

    const mesh = new THREE.Mesh(cube, cubeMaterial) as VoxelMesh;
    mesh.position.set(screenPos[0], screenPos[1], screenPos[2]);
    mesh.overdraw = false;
    this.view.scene.add(mesh);

    this.selected = this.selected.set(key, {
      position: toAbsPos(screenPos),
      mesh,
    });
  }
}

class EraseTool extends VoxelEditorTool {
  cursor: Voxel;

  getToolType(): ToolType { return ToolType.erase; }

  init(params: InitParams) {
    this.cursor = new Voxel(params.view.scene);

    const wait = new WaitState(this);
    const rotate = new RotateState();
    const drag = new DragState(params.view, params.dispatchAction);

    return <VoxelEditorToolStates>{
      [STATE_WAIT]: wait,
      [STATE_DRAG]: drag,
      [STATE_ROTATE]: rotate,
    };
  }

  destroy() {

  }
}

export default EraseTool;
