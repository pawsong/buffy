import * as THREE from 'three';
import * as ndarray from 'ndarray';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  ToolType,
  Volumn,
} from '../../types';

import {
  voxelSelectBox,
} from '../../actions';

import {
  PIXEL_SCALE,
} from '../../../../canvas/Constants';

import SelectionBox from '../objects/SelectionBox';
import SelectBoxState, { EnterParams } from './states/SelectBoxState';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAW = 'draw';

class EdgesSelectionBox extends SelectionBox {
  edges: THREE.EdgesHelper;

  constructor() {
    super();
    this.edges = new THREE.EdgesHelper(this.mesh, 0xFFEB3B);
  }

  createMesh() {
    const cursorGeometry = new THREE.BoxGeometry(1, 1, 1);
    cursorGeometry.translate(0.5, 0.5, 0.5);
    const cursorMaterial = new THREE.MeshBasicMaterial({ visible: false });

    return new THREE.Mesh(cursorGeometry, cursorMaterial);
  }

  show(visible: boolean) {
    this.mesh.visible = visible;
    this.edges.visible = visible;
  }

  resize(width: number, height: number, depth: number) {
    this.mesh.scale.set(width, height, depth).multiplyScalar(PIXEL_SCALE);
  }
}

class BoxSelectTool extends ModelEditorTool<void, void, void> {
  selectionBox: EdgesSelectionBox;

  getToolType() { return ToolType.BOX_SELECT; }

  onInit(params: InitParams) {
    super.onInit(params);
    this.selectionBox = new EdgesSelectionBox();
  }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAW]: new DrawState(this),
    };
  }

  onStart() {
    this.canvas.scene.add(this.selectionBox.mesh);
    this.canvas.scene.add(this.selectionBox.edges);
  }

  onStop() {
    this.canvas.scene.remove(this.selectionBox.mesh);
    this.canvas.scene.remove(this.selectionBox.edges);
  }

  onDestroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: BoxSelectTool) {
    super();

    this.cursor = new Cursor(tool.canvas, {
      mesh: tool.selectionBox.mesh,
      offset: [0, 0, 0],
      getInteractables: () => [
        this.tool.canvas.plane,
        this.tool.canvas.component.modelMesh,
      ],
      onCursorShow: visible => tool.selectionBox.show(visible),
      onMouseDown: params => this.handleMouseDown(params),
    });
  }

  handleMouseDown({ event, intersect }: CursorEventParams) {
    const position = this.cursor.getPosition();
    if (position) {
      this.transitionTo(STATE_DRAW, <EnterParams>{
        anchor: position,
        normal: intersect.face.normal,
      });
    }
  }

  onEnter() {
    this.tool.selectionBox.resize(1, 1, 1);
    this.cursor.start();
  }

  onLeave() {
    this.cursor.stop();
    this.tool.selectionBox.show(false);
  }
}

class DrawState extends SelectBoxState {
  constructor(private tool: BoxSelectTool) {
    super(tool.canvas, tool.selectionBox);
  }

  onBoxSelect(volumn: Volumn) {
    this.tool.dispatchAction(voxelSelectBox(volumn));
  }
}

export default BoxSelectTool;
