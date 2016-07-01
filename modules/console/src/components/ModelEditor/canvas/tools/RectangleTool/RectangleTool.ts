import THREE from 'three';

import { Schema, SchemaType } from '@pasta/helper/lib/diff';

import Cursor, { CursorEventParams } from '../../../../../canvas/Cursor';

import {
  ToolState, ToolStates,
} from '../ModelEditorTool';

import {
  ToolType,
  ModelEditorState,
  Volumn,
  Color,
} from '../../../types';

import {
  voxelAddBatch3d,
} from '../../../actions';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../canvas/Constants';

import AddBlockTool, {
  AddBlockToolWaitState,
  AddBlockToolProps,
} from '../AddBlockTool';

import SelectRectangleState, { EnterParams } from '../states/SelectRectangleState';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAW = 'draw';

abstract class RectangleTool extends AddBlockTool<AddBlockToolProps> {
  getToolType() { return ToolType.RECTANGLE_3D; }

  mapParamsToProps(state: ModelEditorState) {
    return {
      size: state.file.present.data.size,
      color: state.common.paletteColor,
      fragment: state.file.present.data.fragment,
    };
  }

  createStates(): ToolStates {
    const params = this.getParams();
    return {
      [STATE_WAIT]: new WaitState(this, params),
      [STATE_DRAW]: new DrawState(this),
    };
  }

  abstract getAction(volumn: Volumn, color: Color);
}

class WaitState extends AddBlockToolWaitState<EnterParams> {
  getNextStateName() { return STATE_DRAW; }
  getNextStateParams(e: MouseEvent, intersect: THREE.Intersection, position: THREE.Vector3, normal: THREE.Vector3) {
    return {
      size: this.tool.props.size,
      anchor: position,
      normal,
    };
  }
}

class DrawState extends SelectRectangleState {
  constructor(private tool: RectangleTool) {
    super(tool.canvas, tool.selectionBox);
  }

  onSelect(volumn: Volumn) {
    this.tool.dispatchAction(this.tool.getAction(volumn, this.tool.props.color));
  }
}

export default RectangleTool;
