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
  voxelMergeFragment,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;

interface MagicWandToolProps {
  size: Position;
  selection: any;
  fragment: any;
}

class MagicWandTool extends ModelEditorTool<MagicWandToolProps, void, void> {
  getToolType(): ToolType { return ToolType.MAGIC_WAND; }

  mapParamsToProps(params: ModelEditorState) {
    return {
      size: params.file.present.data.size,
      selection: params.file.present.data.selection,
      fragment: params.file.present.data.fragment,
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
      getSize: () => tool.props.size,
      getInteractables: () => [tool.canvas.component.modelMesh],
    });
  }

  onMouseDown() {}

  onMouseUp({ intersect }: CursorEventParams) {
    if (intersect) {
      const position = this.cursor.getPosition();
      this.tool.dispatchAction(
        voxelMaginWand(position.x, position.y, position.z, this.tool.keyboard.isShiftPressed())
      );
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
