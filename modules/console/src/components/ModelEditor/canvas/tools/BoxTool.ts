import THREE from 'three';
import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';

import {
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  Color,
  ToolType,
  ModelEditorState,
  Volumn,
} from '../../types';

import {
  voxelAddBatch3d,
} from '../../actions';

import SelectBoxState, { EnterParams } from './states/SelectBoxState';

import AddBlockTool, {
  AddBlockToolProps,
  AddBlockToolWaitState,
} from './AddBlockTool';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAW = 'draw';

class BoxTool extends AddBlockTool<AddBlockToolProps> {
  getToolType() { return ToolType.BOX; }

  mapParamsToProps(state: ModelEditorState) {
    return {
      size: state.file.present.data.size,
      color: state.common.paletteColors[state.file.present.data.activeMap],
      fragment: state.file.present.data.fragment,
    };
  }

  getParams() {
    return {
      getInteractables: () => [
        this.canvas.component.plane,
        this.canvas.component.modelMesh,
        this.canvas.component.fragmentMesh,
      ],
      interactablesAreRotated: false,
    };
  }

  createStates(): ToolStates {
    const params = this.getParams();
    return {
      [STATE_WAIT]: new WaitState(this, params),
      [STATE_DRAW]: new DrawState(this),
    };
  }
}

class WaitState extends AddBlockToolWaitState<EnterParams> {
  getNextStateName() { return STATE_DRAW; }
  getNextStateParams(e: MouseEvent, intersect: THREE.Intersection, position: THREE.Vector3) {
    return {
      size: this.tool.props.size,
      anchor: position,
      normal: intersect.face.normal,
    };
  }
}

class DrawState extends SelectBoxState {
  constructor(private tool: BoxTool) {
    super(tool.canvas, tool.selectionBox);
  }

  onSelect(volumn: Volumn) {
    this.tool.dispatchAction(voxelAddBatch3d(volumn, this.tool.props.color));
  }
}

export default BoxTool;
