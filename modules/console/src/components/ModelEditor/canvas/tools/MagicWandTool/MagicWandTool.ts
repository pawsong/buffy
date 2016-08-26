import * as THREE from 'three';
import Immutable from 'immutable';

import CursorState from '../states/CursorState';
import Cursor, { CursorEventParams } from '../../../../../canvas/Cursor';
import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from '../ModelEditorTool';

import {
  Position,
  ToolType,
  ModelEditorState,
} from '../../../types';

import {
  voxelMaginWand,
  voxelClearSelection,
  voxelMergeFragment,
} from '../../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;

interface MagicWandToolProps {
  size: Position;
  selection: any;
  fragment: any;
}

export interface MagicWandToolParams {
  getInteractables: () => THREE.Mesh[];
}

abstract class MagicWandTool extends ModelEditorTool<MagicWandToolProps, void, void> {
  getToolType(): ToolType { return ToolType.MAGIC_WAND; }

  mapParamsToProps(params: ModelEditorState) {
    return {
      size: params.file.present.data.size,
      selection: params.file.present.data.selection,
      fragment: params.file.present.data.fragment,
    };
  }

  createStates(): ToolStates {
    const params = this.getParams();

    return {
      [STATE_WAIT]: new WaitState(this, params),
    };
  }

  abstract getAction(position: THREE.Vector3, merge: boolean);

  abstract getParams(): MagicWandToolParams;

  onDestroy() {

  }
}

class WaitState extends CursorState<void> {
  constructor(private tool: MagicWandTool, params: MagicWandToolParams) {
    super(tool.canvas, {
      cursorVisible: false,
      cursorOnFace: false,
      getSize: () => tool.props.size,
      getInteractables: params.getInteractables,
    });
  }

  onMouseDown() {}

  onMouseUp({ intersect }: CursorEventParams) {
    if (intersect) {
      const position = this.cursor.getPosition();
      this.tool.dispatchAction(this.tool.getAction(position, this.tool.keyboard.isShiftPressed()));
    } else {
      if (this.tool.props.fragment) {
        this.tool.dispatchAction(voxelMergeFragment());
      } else if (this.tool.props.selection) {
        const mergeSelection = this.tool.keyboard.isShiftPressed();
        if (!mergeSelection) this.tool.dispatchAction(voxelClearSelection());
      }
    }
  }
}

export default MagicWandTool;
