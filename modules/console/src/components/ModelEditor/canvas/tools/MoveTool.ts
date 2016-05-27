import * as THREE from 'three';
import * as Immutable from 'immutable';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';

import { createGeometryFromMesh } from '../../../../canvas/utils';
import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';
import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
  DESIGN_IMG_SIZE,
} from '../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState,
} from './ModelEditorTool';

import ModelEditorCanvas from '../ModelEditorCanvas';
import { SetState } from '../types';

const fragmentVertexShader = require('raw!../shaders/fragment.vert');
const fragmentFragmentShader = require('raw!../shaders/fragment.frag');

import {
  Position,
  ToolType,
  DispatchAction,
  ModelEditorState,
} from '../../types';

import {
  voxelMaginWand,
  voxelMoveStart,
  voxelMoveEnd,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';
const STATE_ROTATE = 'rotate';

interface MaterialToRestore {
  material: THREE.MeshBasicMaterial;
  color: number;
}

interface MoveToolProps {
  fragmentMesh: any;
  selectionMesh: any;
}

class BoundingBoxEdgesHelper {
  object: THREE.Object3D;
  box: THREE.Box3;
  edges: THREE.LineSegments;

  constructor(object: THREE.Object3D, hex: number) {
    this.object = object;
  	this.box = new THREE.Box3();

    this.edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxBufferGeometry(1, 1, 1), 1),
      new THREE.LineBasicMaterial({ color: hex })
    );
  }

  update() {
    this.box.setFromObject(this.object);
    this.box.size(this.edges.scale);
    this.box.center(this.edges.position);
  }

  dispose() {
    this.edges.geometry.dispose();
    this.edges.material.dispose();
  }
}

class MoveTool extends ModelEditorTool<MoveToolProps> {
  canvas: ModelEditorCanvas;

  translucentMaterial: THREE.Material;

  arrowX: THREE.ArrowHelper;
  arrowY: THREE.ArrowHelper;
  arrowZ: THREE.ArrowHelper;
  boundingBoxHelper: BoundingBoxEdgesHelper;
  fragmentBoundingBoxHelper: BoundingBoxEdgesHelper;

  temp1: THREE.Vector3;
  temp2: THREE.Vector3;
  temp3: THREE.Vector3;

  arrowScene: THREE.Scene;

  private activeCone: THREE.Mesh;
  private materialsToRestore: MaterialToRestore[];

  private fragmentMaterial: THREE.ShaderMaterial;
  private fragmentMesh: THREE.Mesh;

  drawGuide: THREE.Mesh;

  getToolType(): ToolType { return ToolType.MOVE; }

  mapProps(params: ModelEditorState) {
    return {
      fragmentMesh: params.file.present.data.fragmentMesh,
      selectionMesh: params.file.present.data.selectionMesh,
    };
  }

  getPropsSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        fragmentMesh: { type: SchemaType.ANY },
        selectionMesh: { type: SchemaType.ANY },
      }
    };
  }

  private addFragmentMesh(mesh: any) {
    const geometry = createGeometryFromMesh(mesh);
    this.fragmentMesh = new THREE.Mesh(geometry, this.fragmentMaterial);
    this.fragmentMesh.scale.set(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.canvas.scene.add(this.fragmentMesh);

    this.fragmentBoundingBoxHelper = new BoundingBoxEdgesHelper(this.fragmentMesh, 0xE91E63);
    this.fragmentBoundingBoxHelper.update();
    this.canvas.scene.add(this.fragmentBoundingBoxHelper.edges);

    this.fragmentBoundingBoxHelper.box.size(this.temp1);

    this.arrowX.visible = true;
    this.arrowX.position.copy(this.fragmentBoundingBoxHelper.edges.position);
    this.arrowX.setLength(this.temp1.x / 2 + 3 * PIXEL_SCALE, 2 * PIXEL_SCALE, PIXEL_SCALE);

    this.arrowY.visible = true;
    this.arrowY.position.copy(this.fragmentBoundingBoxHelper.edges.position);
    this.arrowY.setLength(this.temp1.y / 2 + 3 * PIXEL_SCALE, 2 * PIXEL_SCALE, PIXEL_SCALE);

    this.arrowZ.visible = true;
    this.arrowZ.position.copy(this.fragmentBoundingBoxHelper.edges.position);
    this.arrowZ.setLength(this.temp1.z / 2 + 3 * PIXEL_SCALE, 2 * PIXEL_SCALE, PIXEL_SCALE);
  }

  private removeFragmentMesh() {
    if (this.fragmentMesh) {
      this.canvas.scene.remove(this.fragmentMesh);
      this.fragmentMesh.geometry.dispose();
      this.fragmentMesh = null;
    }

    if (this.fragmentBoundingBoxHelper) {
      this.canvas.scene.remove(this.fragmentBoundingBoxHelper.edges);
      this.fragmentBoundingBoxHelper.dispose();
      this.fragmentBoundingBoxHelper = null;
    }
  }

  moveFragmentMesh(displacement: THREE.Vector3) {
    this.fragmentMesh.position
      .copy(displacement)
      .multiplyScalar(PIXEL_SCALE);

    this.fragmentBoundingBoxHelper.update();
    this.arrowX.position.copy(this.fragmentBoundingBoxHelper.edges.position);
    this.arrowY.position.copy(this.fragmentBoundingBoxHelper.edges.position);
    this.arrowZ.position.copy(this.fragmentBoundingBoxHelper.edges.position);
  }

  getFragmentPosition(v: THREE.Vector3) {
    v.copy(this.fragmentMesh.position).divideScalar(PIXEL_SCALE).round();
  }

  render(diff: MoveToolProps) {
    if (!this.props.fragmentMesh && !this.props.selectionMesh) {
      this.arrowX.visible = false;
      this.arrowY.visible = false;
      this.arrowZ.visible = false;
    }

    if (diff.hasOwnProperty('fragmentMesh')) {
      this.removeFragmentMesh();
      if (diff.fragmentMesh) this.addFragmentMesh(diff.fragmentMesh);
    }

    if (diff.hasOwnProperty('selectionMesh')) {
      if (this.boundingBoxHelper) {
        this.canvas.scene.remove(this.boundingBoxHelper.edges);
        this.boundingBoxHelper.dispose();
        this.boundingBoxHelper = null;
      }

      if (diff.selectionMesh) {
        this.boundingBoxHelper = new BoundingBoxEdgesHelper(this.canvas.selectionMesh, 0xFFEB3B);
        this.boundingBoxHelper.update();
        this.canvas.scene.add(this.boundingBoxHelper.edges);

        this.boundingBoxHelper.box.size(this.temp1);

        const maxSize = Math.max(this.temp1.x, this.temp1.y, this.temp1.z);

        this.arrowX.visible = true;
        this.arrowX.position.copy(this.boundingBoxHelper.edges.position);
        this.arrowX.setLength(this.temp1.x / 2 + 3 * PIXEL_SCALE, 2 * PIXEL_SCALE, PIXEL_SCALE);

        this.arrowY.visible = true;
        this.arrowY.position.copy(this.boundingBoxHelper.edges.position);
        this.arrowY.setLength(this.temp1.y / 2 + 3 * PIXEL_SCALE, 2 * PIXEL_SCALE, PIXEL_SCALE);

        this.arrowZ.visible = true;
        this.arrowZ.position.copy(this.boundingBoxHelper.edges.position);
        this.arrowZ.setLength(this.temp1.z / 2 + 3 * PIXEL_SCALE, 2 * PIXEL_SCALE, PIXEL_SCALE);
      }
    }
  }

  init(params: InitParams) {
    this.canvas = params.canvas;
    this.temp1 = new THREE.Vector3();
    this.temp2 = new THREE.Vector3();
    this.temp3 = new THREE.Vector3();

    this.activeCone = null;
    this.materialsToRestore = [];

    this.fragmentMaterial = new THREE.ShaderMaterial({
      uniforms: {
        opacity: { type: 'f', value: 0.5 },
        gridColor: { value: new THREE.Vector3(1.0, 0.95, 0.46) },
        gridThickness: { type: 'f', value: 0.05 },
      },
      vertexShader: fragmentVertexShader,
      fragmentShader: fragmentFragmentShader,
      transparent: true,
    });
    this.fragmentMaterial.extensions.derivatives = true;

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

    const wait = new WaitState(this, params.canvas);
    const rotate = new RotateState();
    const drag = new DragState(this, params.canvas, params.dispatchAction);

    return {
      [STATE_WAIT]: wait,
      [STATE_DRAG]: drag,
      [STATE_ROTATE]: rotate,
    };
  }

  activateArrow(cone: THREE.Mesh) {
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

  updateDrawGuide(direction: THREE.Vector3) {
    if (!this.boundingBoxHelper) return;

    this.boundingBoxHelper.box.size(this.temp1);
    const { position } = this.boundingBoxHelper.edges;

    const len = DESIGN_IMG_SIZE * PIXEL_SCALE * 4;
    const pos = DESIGN_IMG_SIZE * PIXEL_SCALE / 2;

    this.temp2.copy(direction).subScalar(1).multiplyScalar(-1);

    this.drawGuide.scale.copy(this.temp1).multiply(this.temp2)
      .add(this.temp3.copy(direction).multiplyScalar(len));
    this.drawGuide.position.copy(position).multiply(this.temp2)
      .add(this.temp3.copy(direction).multiplyScalar(pos));
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

    if (this.boundingBoxHelper) {
      this.canvas.scene.remove(this.boundingBoxHelper.edges);

      this.boundingBoxHelper.dispose();
      this.boundingBoxHelper = null;
    }

    this.removeFragmentMesh();
  }

  destroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  materialsToRestore: MaterialToRestore[];
  activeMeshes: THREE.Mesh[];

  constructor(
    private tool: MoveTool,
    private canvas: ModelEditorCanvas
  ) {
    super();
    this.materialsToRestore = [];
    this.activeMeshes = [];

    const offset = new THREE.Vector3();

    this.cursor = new Cursor(canvas, {
      visible: false,
      getInteractables: () => [
        tool.arrowX.cone,
        tool.arrowY.cone,
        tool.arrowZ.cone,
      ],
      onInteract: params => this.handleInteract(params),
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

  private handleInteract({ intersect }: CursorEventParams) {
    const cone = <THREE.Mesh>intersect.object;
    this.tool.activateArrow(cone);
  }

  private handleMouseDown({ event, intersect }: CursorEventParams) {
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

  private direction: THREE.Vector3;
  private origin: THREE.Vector3;
  private target: THREE.Vector3;

  private temp1: THREE.Vector3;

  constructor(
    private tool: MoveTool,
    private canvas: ModelEditorCanvas,
    private dispatchAction: DispatchAction
  ) {
    super();
    this.direction = new THREE.Vector3();
    this.origin = new THREE.Vector3();
    this.target = new THREE.Vector3();

    this.temp1 = new THREE.Vector3();

    const offset = new THREE.Vector3();

    const intersectables = [this.tool.drawGuide];

    this.cursor = new Cursor(canvas, {
      visible: false,
      getInteractables: () => intersectables,
      onInteract: params => this.handleInteract(params),
      onMouseUp: () => this.handleMouseUp(),
    });
  }

  onEnter(event: MouseEvent) {
    this.canvas.controls.enableRotate = false;

    this.tool.getDirection(this.direction);
    this.tool.updateDrawGuide(this.direction);

    // Detach selected mesh from current model
    // and create a new moving model fragment.
    this.dispatchAction(voxelMoveStart());
    this.cursor.start();

    this.cursor.getPositionFromMouseEvent(event, this.origin);
    this.target.copy(this.origin);
  }

  private handleInteract(params: CursorEventParams) {
    const position = this.cursor.getPosition();

    if (!position) return;

    if (this.target.equals(position)) return;
    this.target.copy(position);

    this.tool.moveFragmentMesh(this.temp1.subVectors(this.target, this.origin).multiply(this.direction));
  }

  private handleMouseUp() {
    this.transitionTo(STATE_WAIT, event);
  }

  onLeave() {
    this.canvas.controls.enableRotate = true;

    this.tool.getFragmentPosition(this.temp1);

    // Merge fragment into base model.
    this.dispatchAction(voxelMoveEnd(this.temp1.x, this.temp1.y, this.temp1.z));

    this.cursor.stop();
  }
}

class RotateState extends ToolState {
  handleMouseUp = () => this.transitionTo(STATE_WAIT)
  onEnter() { document.addEventListener('mouseup', this.handleMouseUp, false); }
  onLeave() { document.removeEventListener('mouseup', this.handleMouseUp, false); }
}

export default MoveTool;
