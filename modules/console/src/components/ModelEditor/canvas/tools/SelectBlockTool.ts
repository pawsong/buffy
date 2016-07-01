import THREE from 'three';
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

interface SelectBoxToolProps {
  size: Position;
  selection: ndarray.Ndarray;
  fragment: ndarray.Ndarray;
}

interface SelectBoxToolParams {
  getInteractables: () => THREE.Mesh[];
  interactablesAreRotated: boolean;
  getOffset?: (intersect: THREE.Intersection, normal: THREE.Vector3) => THREE.Vector3;
}

abstract class SelectBlockTool extends ModelEditorTool<SelectBoxToolProps, void, void> {
  selectionBox: EdgesSelectionBox;

  abstract getParams(): SelectBoxToolParams;

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

class SelectBlockToolWaitState extends CursorState<EnterParams> {
  protected tool: SelectBlockTool;
  private temp1: THREE.Vector3;

  constructor(tool: SelectBlockTool, params: SelectBoxToolParams) {
    const origin = new THREE.Vector3();
    const offset = new THREE.Vector3();

    super(tool.canvas, {
      cursorOnFace: false,
      cursorMesh: tool.selectionBox.mesh,
      interactablesAreRotated: params.interactablesAreRotated,
      onCursorShow: visible => tool.selectionBox.show(visible),
      getSize: () => tool.props.size,
      getInteractables: params.getInteractables,
      getOffset: params.getOffset,
    });

    this.tool = tool;

    this.temp1 = new THREE.Vector3();
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

export default SelectBlockTool;
export {
  SelectBlockToolWaitState,
}
