import * as THREE from 'three';

import ModelEditorTool, {
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  ToolType,
  Volumn,
  ModelEditorState,
} from '../../types';

import {
  voxelSelectBox,
} from '../../actions';

import {
  PIXEL_SCALE,
} from '../../../../canvas/Constants';

import SelectBlockTool, {
  SelectBlockToolWaitState,
} from './SelectBlockTool';

import SelectBoxState, { EnterParams } from './states/SelectBoxState';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAW = 'draw';

class BoxSelectTool extends SelectBlockTool {
  getToolType() { return ToolType.BOX_SELECT; }

  getParams() {
    const origin = new THREE.Vector3();
    const offset = new THREE.Vector3();

    return {
      getInteractables: () => [
        this.canvas.component.plane,
        this.canvas.component.modelMesh,
        this.canvas.component.fragmentMesh,
      ],
      interactablesAreRotated: false,
      getOffset: (intersect: THREE.Intersection) => {
        if (intersect.object === this.canvas.component.plane) {
          return offset.copy(intersect.face.normal).multiplyScalar(PIXEL_SCALE);
        } else {
          return origin;
        }
      },
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
      normal: intersect.face.normal,
    };
  }
}

class DrawState extends SelectBoxState {
  constructor(private tool: BoxSelectTool) {
    super(tool.canvas, tool.selectionBox);
  }

  onSelect(volumn: Volumn) {
    this.tool.dispatchAction(voxelSelectBox(volumn, this.tool.keyboard.isShiftPressed()));
  }
}

export default BoxSelectTool;
