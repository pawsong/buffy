import * as THREE from 'three';
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
  voxelAddBatch,
} from '../../actions';

import SelectBoxState, { EnterParams } from './states/SelectBoxState';

import AddBlockTool, { AddBlockToolWaitState } from './AddBlockTool';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAW = 'draw';

class BoxTool extends AddBlockTool {
  getToolType() { return ToolType.BOX; }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAW]: new DrawState(this),
    };
  }
}

class WaitState extends AddBlockToolWaitState<EnterParams> {
  getNextStateName() { return STATE_DRAW; }
  getNextStateParams(e: MouseEvent, intersect: THREE.Intersection, position: THREE.Vector3) {
    return {
      anchor: position,
      normal: intersect.face.normal,
    };
  }
}

class DrawState extends SelectBoxState {
  constructor(private tool: BoxTool) {
    super(tool.canvas, tool.selectionBox);
  }

  onBoxSelect(volumn: Volumn) {
    this.tool.dispatchAction(voxelAddBatch(volumn, this.tool.props.color));
  }
}

export default BoxTool;
