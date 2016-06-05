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
  Color,
  ModelEditorState,
} from '../../types';

import {
  voxelColorFill,
  voxelMergeFragment,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;

interface ColorFillToolProps {
  size: Position;
  selection: any;
  fragment: any;
  paletteColor: Color;
}

class ColorFillTool extends ModelEditorTool<ColorFillToolProps, void, void> {
  getToolType(): ToolType { return ToolType.COLOR_FILL; }

  mapParamsToProps(params: ModelEditorState) {
    return {
      size: params.file.present.data.size,
      selection: params.file.present.data.selection,
      fragment: params.file.present.data.fragment,
      paletteColor: params.common.paletteColor,
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
  constructor(private tool: ColorFillTool) {
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
      this.tool.dispatchAction(voxelColorFill(position.x, position.y, position.z, this.tool.props.paletteColor));
    } else {
      if (this.tool.props.fragment) this.tool.dispatchAction(voxelMergeFragment());
    }
  }
}

export default ColorFillTool;
