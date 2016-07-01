import THREE from 'three';

import ModelEditorTool, {
  ToolState, ToolStates,
} from '../ModelEditorTool';

import {
  ToolType,
  Volumn,
  ModelEditorState,
} from '../../../types';

import {
  voxelSelectBox,
} from '../../../actions';

import {
  PIXEL_SCALE,
} from '../../../../../canvas/Constants';

import SelectBlockTool, {
  SelectBlockToolWaitState,
} from '../SelectBlockTool';

import SelectRectangleState, { EnterParams } from '../states/SelectRectangleState';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAW = 'draw';

class RectangleSelectTool2d extends SelectBlockTool {
  getToolType() { return ToolType.RECTANGLE_SELECT_2D; }

  getParams() {
    const origin = new THREE.Vector3();
    const offset = new THREE.Vector3();

    return {
      interactablesAreRotated: true,
      getInteractables: () => [
        this.canvas.component.mode2dPlaneMesh,
        this.canvas.component.model2DSliceMesh,
      ],
      getOffset: (intersect, normal) => intersect.object === this.canvas.component.mode2dPlaneMesh
        ? offset.copy(normal).multiplyScalar(PIXEL_SCALE)
        : origin,
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

class WaitState extends SelectBlockToolWaitState {
  getNextStateName() { return STATE_DRAW; }
  getNextStateParams(e: MouseEvent, intersect: THREE.Intersection, position: THREE.Vector3) {
    return {
      size: this.tool.props.size,
      anchor: position,
      normal: this.tool.canvas.component.mode2DClippingPlane.normal,
    };
  }
}

class DrawState extends SelectRectangleState {
  constructor(private tool: RectangleSelectTool2d) {
    super(tool.canvas, tool.selectionBox);
  }

  onSelect(volumn: Volumn) {
    this.tool.dispatchAction(voxelSelectBox(volumn, this.tool.keyboard.isShiftPressed()));
  }
}

export default RectangleSelectTool2d;
