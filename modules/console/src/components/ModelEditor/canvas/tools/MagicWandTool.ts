import * as THREE from 'three';
import * as Immutable from 'immutable';

import CursorState from './states/CursorState';
import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';
import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  Position,
  ToolType,
  ModelEditorState,
} from '../../types';

import {
  voxelMaginWand,
  voxelClearSelection,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;

interface MagicWandToolProps {
  selection: any;
}

class MagicWandTool extends ModelEditorTool<MagicWandToolProps, void, void> {
  getToolType(): ToolType { return ToolType.MAGIC_WAND; }

  mapParamsToProps(params: ModelEditorState) {
    return {
      selection: params.file.present.data.selection,
    };
  }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
    };
  }

  onDestroy() {

  }
}

class WaitState extends CursorState<void> {
  constructor(private tool: MagicWandTool) {
    super(tool.canvas, {
      cursorVisible: false,
      cursorOnFace: false,
      getInteractables: () => [tool.canvas.component.modelMesh],
    });
  }

  onMouseDown(e: MouseEvent, intersect: THREE.Intersection, position: THREE.Vector3) {
    if (position) {
      this.tool.dispatchAction(
        voxelMaginWand(position.x, position.y, position.z, this.tool.keyboard.isShiftPressed())
      );
    } else {
      if (this.tool.props.selection) this.tool.dispatchAction(voxelClearSelection());
    }
  }
}

export default MagicWandTool;
