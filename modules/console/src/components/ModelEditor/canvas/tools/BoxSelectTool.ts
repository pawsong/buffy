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
  ModelEditorState,
  Position,
} from '../../types';

import {
  voxelSelectBox,
  voxelClearSelection,
  voxelMergeFragment,
} from '../../actions';

import {
  PIXEL_SCALE,
} from '../../../../canvas/Constants';

import CursorState from './states/CursorState';
import SelectBoxState, { EnterParams } from './states/SelectBoxState';

import SelectionBox from '../objects/SelectionBox';

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

interface BoxSelectToolProps {
  size: Position;
  selection: ndarray.Ndarray;
  fragment: ndarray.Ndarray;
}

class BoxSelectTool extends ModelEditorTool<BoxSelectToolProps, void, void> {
  selectionBox: EdgesSelectionBox;

  getToolType() { return ToolType.BOX_SELECT; }

  mapParamsToProps(state: ModelEditorState) {
    return {
      size: state.file.present.data.size,
      selection: state.file.present.data.selection,
      fragment: state.file.present.data.fragment,
    };
  }

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

class WaitState extends CursorState<EnterParams> {
  private tool: BoxSelectTool;
  private temp1: THREE.Vector3;

  constructor(tool: BoxSelectTool) {
    const origin = new THREE.Vector3();
    const offset = new THREE.Vector3();

    super(tool.canvas, {
      cursorOnFace: false,
      cursorMesh: tool.selectionBox.mesh,
      onCursorShow: visible => tool.selectionBox.show(visible),
      getSize: () => tool.props.size,
      getInteractables: () => [
        tool.canvas.component.plane,
        tool.canvas.component.modelMesh,
        tool.canvas.component.fragmentMesh,
      ],
      getOffset: intersect => {
        if (intersect.object === tool.canvas.component.plane) {
          return offset.copy(intersect.face.normal).multiplyScalar(PIXEL_SCALE);
        } else {
          return origin;
        }
      },
    });

    this.tool = tool;

    this.temp1 = new THREE.Vector3();
  }

  getNextStateName() { return STATE_DRAW; }
  getNextStateParams(e: MouseEvent, intersect: THREE.Intersection, position: THREE.Vector3) {
    return {
      size: this.tool.props.size,
      anchor: position,
      normal: intersect.face.normal,
    };
  }

  onMouseDown() {}

  onMouseUp() {
    if (this.tool.props.fragment) {
      this.tool.dispatchAction(voxelMergeFragment());
    } else if (this.tool.props.selection) {
      const mergeSelection = this.tool.keyboard.isShiftPressed();
      if (!mergeSelection) this.tool.dispatchAction(voxelClearSelection());
    }
  }

  onEnter() {
    this.tool.selectionBox.resize(1, 1, 1);
    super.onEnter();
  }

  onLeave() {
    super.onLeave();
    this.tool.selectionBox.show(false);
  }
}

class DrawState extends SelectBoxState {
  constructor(private tool: BoxSelectTool) {
    super(tool.canvas, tool.selectionBox);
  }

  onBoxSelect(volumn: Volumn) {
    this.tool.dispatchAction(voxelSelectBox(volumn, this.tool.keyboard.isShiftPressed()));
  }
}

export default BoxSelectTool;
