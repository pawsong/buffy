import * as THREE from 'three';
import { Ndarray } from 'ndarray';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';
import HandleHelper from '../objects/HandleHelper';
import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  Color,
  ToolType,
  ModelEditorState,
  Volumn,
  Position,
} from '../../types';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../canvas/Constants';

import {
  voxelMergeFragment,
  voxelResize,
} from '../../actions';

const MAX_MODEL_SIZE = 64;

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';

const nx = new THREE.Vector3(-1,  0,  0);
const px = new THREE.Vector3(+1,  0,  0);
const ny = new THREE.Vector3(0 , -1,  0);
const py = new THREE.Vector3(0 , +1,  0);
const nz = new THREE.Vector3(0 ,  0, -1);
const pz = new THREE.Vector3(0 ,  0, +1);

const origin = new THREE.Vector3();

interface MaterialToRestore {
  material: THREE.MeshBasicMaterial;
  color: number;
}

interface ResizeToolProps {
  size: Position;
  fragment: Ndarray;
}

interface ResizeToolTree {
  size: Position;
}

class ResizeTool extends ModelEditorTool<ResizeToolProps, void, ResizeToolTree> {
  boundingBox: THREE.Mesh;
  handles: HandleHelper[];

  private materialsToRestore: MaterialToRestore[];
  private edges: THREE.EdgesHelper;
  private toolScene: THREE.Scene;

  private nxHandle: HandleHelper;
  private pxHandle: HandleHelper;
  private nyHandle: HandleHelper;
  private pyHandle: HandleHelper;
  private nzHandle: HandleHelper;
  private pzHandle: HandleHelper;

  getToolType() { return ToolType.RESIZE; }

  mapParamsToProps(params: ModelEditorState) {
    const { size } = params.file.present.data;

    return {
      size,
      fragment: params.file.present.data.fragment,
    };
  }

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        size: { type: SchemaType.ANY },
      },
    };
  }

  render() {
    return {
      size: this.props.size,
    };
  }

  patch(diff: ResizeToolTree) {
    if (diff.hasOwnProperty('size')) {
      const { size } = this.tree;

      this.nxHandle.position.set(0          , size[1] / 2, size[2] / 2).multiplyScalar(PIXEL_SCALE);
      this.pxHandle.position.set(size[0]    , size[1] / 2, size[2] / 2).multiplyScalar(PIXEL_SCALE);
      this.nyHandle.position.set(size[0] / 2, 0          , size[2] / 2).multiplyScalar(PIXEL_SCALE);
      this.pyHandle.position.set(size[0] / 2, size[1]    , size[2] / 2).multiplyScalar(PIXEL_SCALE);
      this.nzHandle.position.set(size[0] / 2, size[1] / 2, 0          ).multiplyScalar(PIXEL_SCALE);
      this.pzHandle.position.set(size[0] / 2, size[1] / 2, size[2]    ).multiplyScalar(PIXEL_SCALE);

      this.boundingBox.position.copy(origin);
      this.boundingBox.scale
        .set(size[0], size[1], size[2])
        .multiplyScalar(PIXEL_SCALE);
      this.boundingBox.updateMatrixWorld(false);
    }
  }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAG]: new DragState(this),
    };
  }

  onInit(params: InitParams) {
    super.onInit(params);

    this.materialsToRestore = [];

    this.toolScene = new THREE.Scene();

    this.nxHandle = this.createHandle(nx, 0xF44336);
    this.pxHandle = this.createHandle(px, 0xF44336);
    this.nyHandle = this.createHandle(ny, 0x4CAF50);
    this.pyHandle = this.createHandle(py, 0x4CAF50);
    this.nzHandle = this.createHandle(nz, 0x2196F3);
    this.pzHandle = this.createHandle(pz, 0x2196F3);

    this.toolScene.add(this.nxHandle);
    this.toolScene.add(this.pxHandle);
    this.toolScene.add(this.nyHandle);
    this.toolScene.add(this.pyHandle);
    this.toolScene.add(this.nzHandle);
    this.toolScene.add(this.pzHandle);

    this.handles = [this.nxHandle, this.pxHandle, this.nyHandle, this.pyHandle, this.nzHandle, this.pzHandle];

    const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
    geometry.translate(0.5, 0.5, 0.5);

    const material = new THREE.MeshBasicMaterial({ visible: false });

    this.boundingBox = new THREE.Mesh(geometry, material);
    this.edges = new THREE.EdgesHelper(this.boundingBox);
  }

  private createHandle(dir: THREE.Vector3, color: number) {
    const handle = new HandleHelper(dir, origin, PIXEL_SCALE, color);
    handle.setLength(3 / 4, 1 / 4, 1 / 4);
    return handle;
  }

  onCameraMove() {
    const scale = this.canvas.camera.position.length() / 10;
    this.nxHandle.scale.set(scale, scale, scale);
    this.pxHandle.scale.set(scale, scale, scale);
    this.nyHandle.scale.set(scale, scale, scale);
    this.pyHandle.scale.set(scale, scale, scale);
    this.nzHandle.scale.set(scale, scale, scale);
    this.pzHandle.scale.set(scale, scale, scale);
  }

  onStart() {
    this.onCameraMove();
    this.canvas.scene.add(this.edges);
  }

  onStop() {
    this.canvas.scene.remove(this.edges);
  }

  highlight(handle: HandleHelper) {
    this.resetHighlight();

    handle.children.forEach((object: THREE.Mesh) => {
      const material = <THREE.MeshBasicMaterial>object.material;
      this.materialsToRestore.push({
        material: material,
        color: material.color.getHex(),
      });
      material.color.setRGB(1, 1, 1);
    });
  }

  resetHighlight() {
    if (this.materialsToRestore.length > 0) {
      this.materialsToRestore.forEach(({ material, color }) => material.color.setHex(color));
      this.materialsToRestore = [];
    }
  }

  onRender() {
    super.onRender();
    this.canvas.renderer.clearDepth();
    this.canvas.renderer.render(this.toolScene, this.canvas.camera);
  }

  onDestroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: ResizeTool) {
    super();

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      cursorOnFace: false,
      intersectRecursively: true,
      getInteractables: () => this.tool.handles,
      onHit: params => this.handleHit(params),
      onMiss: params => this.handleMiss(params),
      onMouseDown: params => this.handleMouseDown(params),
      onMouseUp: () => this.handleMouseUp(),
    });
  }

  onEnter() {
    this.tool.resetHighlight();
    this.cursor.start();
  }

  onLeave() {
    this.cursor.stop();
  }

  handleHit({ intersect }: CursorEventParams) {
    const handle = <HandleHelper>intersect.object.parent;
    this.tool.highlight(handle);
  }

  handleMiss({ intersect }: CursorEventParams) {
    this.tool.resetHighlight();
  }

  handleMouseDown({ event, intersect }: CursorEventParams) {
    if (intersect) {
      const handle = <HandleHelper>intersect.object.parent;
      this.transitionTo(STATE_DRAG, <DragStateEnterParams>{
        event,
        direction: handle.direction,
      });
    }
  }

  handleMouseUp() {
    if (this.tool.props.fragment) this.tool.dispatchAction(voxelMergeFragment());
  }
}

interface DragStateEnterParams {
  event: MouseEvent;
  direction: THREE.Vector3;
}

const DRAW_GUIDE_SCALE = 10;

class DragState extends ToolState {
  cursor: Cursor;
  drawGuide: THREE.Mesh;

  private temp1: THREE.Vector3;
  private temp2: THREE.Vector3;

  private dir: THREE.Vector3;
  private pdir: THREE.Vector3;
  private uv: THREE.Vector3;
  private dirIsPositive: boolean;

  private initialLength: number;
  private offset: number;
  private result: number;
  private anchor: number;
  private target: number;

  constructor(private tool: ResizeTool) {
    super();

    this.dir = new THREE.Vector3();
    this.pdir = new THREE.Vector3();
    this.uv = new THREE.Vector3();

    this.temp1 = new THREE.Vector3();
    this.temp2 = new THREE.Vector3();

    const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
    geometry.scale(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);

    const material = new THREE.MeshBasicMaterial();
    this.drawGuide = new THREE.Mesh(geometry, material);

    // // For debugging
    // material.opacity = 0.5;
    // material.color.setHex(0xff0000);
    // this.tool.canvas.scene.add(this.drawGuide);

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      getInteractables: () => [this.drawGuide],
      onMouseUp: this.handleMouseUp,
      onHit: this.handleHit,
    });
  }

  onEnter({ event, direction }: DragStateEnterParams) {
    const { size } = this.tool.props;

    this.dir.copy(direction);
    this.pdir.copy(this.dir).multiply(this.dir);
    this.dirIsPositive = this.dir.dot(this.pdir) > 0;

    this.uv.copy(this.pdir).subScalar(1).multiplyScalar(-1);

    this.temp1.set(size[0], size[1], size[2]);
    this.initialLength = this.result = this.temp1.dot(this.pdir);
    this.offset = 0;

    this.drawGuide.position.copy(this.temp1).multiplyScalar(PIXEL_SCALE_HALF);

    this.drawGuide.scale
      .set(MAX_MODEL_SIZE, MAX_MODEL_SIZE, MAX_MODEL_SIZE).multiplyScalar(DRAW_GUIDE_SCALE)
      .multiply(this.pdir).add(this.temp1.multiply(this.uv));
    this.drawGuide.updateMatrixWorld(false);

    this.cursor.start();

    this.cursor.getPositionFromMouseEvent(event, this.temp1);
    this.target = this.anchor = this.temp1.dot(this.pdir);
  }

  private handleHit = (params: CursorEventParams) => {
    const position = this.cursor.getPosition();
    if (!position) return;

    const pos = position.dot(this.pdir);

    if (this.target === pos) return;
    this.target = pos;

    const displacement = this.target - this.anchor;

    if (this.dirIsPositive) {
      this.result = Math.min(MAX_MODEL_SIZE, Math.max(this.initialLength + displacement, 1));
      this.offset = 0;
    } else {
      this.result = Math.min(MAX_MODEL_SIZE, Math.max(this.initialLength - displacement, 1));
      this.offset = this.initialLength - this.result;
    }

    this.temp1.multiplyVectors(this.uv, this.tool.boundingBox.scale);
    this.tool.boundingBox.position.copy(this.pdir).multiplyScalar(this.offset * PIXEL_SCALE);
    this.tool.boundingBox.scale.copy(this.pdir).multiplyScalar(this.result * PIXEL_SCALE).add(this.temp1);

    this.tool.boundingBox.updateMatrixWorld(false);
  };

  private handleMouseUp = (params: CursorEventParams) => {
    if (this.initialLength !== this.result) {
      const { size } = this.tool.props;

      this.temp1.set(size[0], size[1], size[2])
        .multiply(this.uv)
        .add(this.temp2.copy(this.pdir).multiplyScalar(this.result));

      this.temp2.copy(this.pdir).multiplyScalar(-this.offset);

      this.tool.dispatchAction(voxelResize(
        this.temp1.x, this.temp1.y, this.temp1.z,
        this.temp2.x, this.temp2.y, this.temp2.z)
      );
    }
    this.transitionTo(STATE_WAIT);
  };

  onLeave() {
    this.cursor.stop();
  }
}

export default ResizeTool;
