import * as THREE from 'three';

import VoxelEditorTool, {
  HandlerResult,
  InitParams,
  InteractParams,
  VoxelEditorToolState,
  VoxelEditorToolStates,
  MouseUpParams,
  MouseDownParams,
} from './VoxelEditorTool';

import MainCanvas from '../views/main';
import { SetState } from '../types';

import {
  Position,
  Color,
  ToolType,
  ModelEditorState,
  DispatchAction,
} from '../../types';

import Voxel, { VoxelMesh } from '../Voxel';

import {
  voxelAddBatch,
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

const STATE_WAIT = VoxelEditorToolState.STATE_WAIT;
const STATE_DRAW = 'draw';
const STATE_ROTATE = 'rotate';

const cube = new THREE.CubeGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);

interface RotateStateProps {

}

class RotateState extends VoxelEditorToolState<RotateStateProps> {
  onMouseUp(): HandlerResult {
    return { state: STATE_WAIT };
  }
  render() {}
}

interface StateWithBrushProps {
  paletteColor: Color;
}

class StateWithBrush extends VoxelEditorToolState<StateWithBrushProps> {
  tool: BrushTool;

  constructor(tool: BrushTool) {
    super();
    this.tool = tool;
  }

  mapStateToProps(appState: ModelEditorState): StateWithBrushProps {
    return { paletteColor: appState.paletteColor };
  }

  render() {
    const color = this.props.paletteColor;
    this.tool.brush.mesh.material.color.setStyle(`rgb(${color.r},${color.g},${color.b})`);
  }
}

class WaitState extends StateWithBrush {
  isIntersectable(object) {
    return object.isVoxel || object.isPlane;
  }

  onMouseDown({ intersect }: MouseDownParams): HandlerResult {
    if (intersect) {
      return { state: STATE_DRAW };
    } else {
      return { state: STATE_ROTATE };
    }
  }

  onInteract({ intersect }: InteractParams) {
    if (!intersect) {
      this.tool.brush.hide();
      return;
    }

    const normal = intersect.face.normal;
    const position = new THREE.Vector3().addVectors( intersect.point, normal )

    this.tool.brush.move({
      x: Math.floor( position.x / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
      y: Math.floor( position.y / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
      z: Math.floor( position.z / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
    });
  }

  onLeave() {
    this.tool.brush.hide();
  }
}

class DrawState extends StateWithBrush {
  private view: MainCanvas;
  private dispatchAction: DispatchAction;

  drawGuideMeshes: any[];
  selectedMeshes: any[];

  constructor(
    tool: BrushTool,
    view: MainCanvas,
    dispatchAction: DispatchAction
  ) {
    super(tool);
    this.view = view;
    this.dispatchAction = dispatchAction;

    this.drawGuideMeshes = [];
    this.selectedMeshes = [];
  }

  isIntersectable(object) {
    return object.isDrawGuide;
  }

  onEnter(): HandlerResult {
    this.view.controls.enableRotate = false;

    const brushPosition = this.tool.brush.position;
    const absPos = toAbsPos([brushPosition.x, brushPosition.y, brushPosition.z]);

    let prev;
    const center = this.addDrawGuideMesh(absPos, null);

    prev = center;
    for (let i = absPos[0] - 1; i >= 1; --i) {
      prev = this.addDrawGuideMesh([
        i, absPos[1], absPos[2],
      ], prev);
    }
    prev = center;
    for (let i = absPos[0] + 1; i <= GRID_SIZE; ++i) {
      prev = this.addDrawGuideMesh([
        i, absPos[1], absPos[2],
      ], prev);
    }

    prev = center;
    for (let i = absPos[1] - 1; i >= 1; --i) {
      prev = this.addDrawGuideMesh([
        absPos[0], i, absPos[2],
      ], prev);
    }
    prev = center;
    for (let i = absPos[1] + 1; i <= GRID_SIZE; ++i) {
      prev = this.addDrawGuideMesh([
        absPos[0], i, absPos[2],
      ], prev);
    }

    prev = center;
    for (let i = absPos[2]; i >= 1; --i) {
      prev = this.addDrawGuideMesh([
        absPos[0], absPos[1], i,
      ], prev);
    }
    prev = center;
    for (let i = absPos[2] + 1; i <= GRID_SIZE; ++i) {
      prev = this.addDrawGuideMesh([
        absPos[0], absPos[1], i,
      ], prev);
    }

    center.material.opacity = 0.5;
    center.wireMesh.visible = true;
    this.selectedMeshes = [center];
  }

  onLeave() {
    this.view.controls.enableRotate = true;
  }

  onInteract({ intersect }: InteractParams) {
    if (!intersect) return;

    // this.tool.brush.hide();
    this.selectedMeshes.forEach(object => {
      object.material.opacity = 0;
      object.wireMesh.visible = false;
    });
    this.selectedMeshes = [];

    let object: any = intersect.object;
    while(object) {
      object.material.opacity = 0.5;
      object.wireMesh.visible = true;

      this.selectedMeshes.push(object);
      object = object.prev;
    }
  }

  onMouseUp({ intersect }: MouseUpParams) {
    if (this.selectedMeshes.length !== 0) {
      const color = this.props.paletteColor;

      const action = voxelAddBatch(this.selectedMeshes.map(mesh => ({
        color,
        position: toAbsPos([mesh.position.x, mesh.position.y, mesh.position.z]),
      })));

      this.dispatchAction(voxelAddBatch(this.selectedMeshes.map(mesh => ({
        color,
        position: toAbsPos([mesh.position.x, mesh.position.y, mesh.position.z]),
      }))));
    }

    this.resetDrawGuideMeshes();
    return { state: STATE_WAIT };
  }

  addDrawGuideMesh(absPos: Position, prevMesh) {
    const position = toScreenPos(absPos);
    const material = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0,
      transparent: true,
    });
    material.color.copy(this.tool.brush.mesh.material.color);

    const mesh: any = new THREE.Mesh(cube, material);
    mesh.visible = true;
    mesh.overdraw = false;
    mesh.position.set(position[0], position[1], position[2]);
    mesh.isDrawGuide = true;
    this.view.scene.add(mesh);

    const wireMesh = new THREE.EdgesHelper(mesh, 0x000000);
    wireMesh.visible = false;
    wireMesh.material.transparent = true;
    wireMesh.material.opacity = 0.8;
    this.view.scene.add(wireMesh);

    mesh.wireMesh = wireMesh;
    mesh.prev = prevMesh;
    this.drawGuideMeshes.push(mesh);
    return mesh;
  }

  resetDrawGuideMeshes() {
    this.drawGuideMeshes.forEach(mesh => {
      this.view.scene.remove(mesh);
      this.view.scene.remove(mesh.wireMesh);
    });
    this.drawGuideMeshes = [];
    this.selectedMeshes = [];
  }
}

interface DrawGuideMesh extends VoxelMesh {
  isDrawGuide: boolean;
  wireMesh: THREE.EdgesHelper;
  prev: DrawGuideMesh;
}

class BrushTool extends VoxelEditorTool {
  brush: Voxel;
  view: MainCanvas;

  getToolType() {
    return ToolType.brush;
  }

  init(params: InitParams) {
    this.brush = new Voxel(params.view.scene);
    this.brush.mesh.isBrush = true;

    this.view = params.view;

    const wait = new WaitState(this);
    const rotate = new RotateState();
    const draw = new DrawState(this, params.view, params.dispatchAction);

    return <VoxelEditorToolStates>{
      [STATE_WAIT]: wait,
      [STATE_ROTATE]: rotate,
      [STATE_DRAW]: draw,
    };
  }

  destroy() {

  }
}

export default BrushTool;
