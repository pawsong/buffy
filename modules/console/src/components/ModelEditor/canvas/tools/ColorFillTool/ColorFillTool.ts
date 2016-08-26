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
  Color,
  ModelEditorState,
} from '../../../types';

import {
  voxelMergeFragment,
} from '../../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;

interface ColorFillToolProps {
  size: Position;
  selection: any;
  fragment: any;
  paletteColor: Color;
}

export interface ColorFillToolParams {
  interactablesAreRotated: boolean;
  getInteractables: () => THREE.Mesh[];
  getOffset?: (intersect: THREE.Intersection, normal: THREE.Vector3) => THREE.Vector3;
}

abstract class ColorFillTool extends ModelEditorTool<ColorFillToolProps, void, void> {
  getToolType(): ToolType { return ToolType.COLOR_FILL; }

  mapParamsToProps(params: ModelEditorState) {
    return {
      size: params.file.present.data.size,
      selection: params.file.present.data.selection,
      fragment: params.file.present.data.fragment,
      paletteColor: params.common.paletteColors[params.file.present.data.activeMap],
    };
  }

  createStates(): ToolStates {
    const params = this.getParams();

    return {
      [STATE_WAIT]: new WaitState(this, params),
    };
  }

  abstract getParams(): ColorFillToolParams;

  abstract getAction(position: THREE.Vector3, color: Color);

  onDestroy() {

  }
}

class WaitState extends CursorState<void> {
  constructor(private tool: ColorFillTool, params: ColorFillToolParams) {
    super(tool.canvas, {
      cursorVisible: false,
      cursorOnFace: false,
      interactablesAreRotated: params.interactablesAreRotated,
      getSize: () => tool.props.size,
      getInteractables: params.getInteractables,
      getOffset: params.getOffset,
    });
  }

  onMouseDown() {}

  onMouseUp({ intersect }: CursorEventParams) {
    if (intersect) {
      const position = this.cursor.getPosition();
      this.tool.dispatchAction(this.tool.getAction(position, this.tool.props.paletteColor));
    } else {
      if (this.tool.props.fragment) this.tool.dispatchAction(voxelMergeFragment());
    }
  }
}

export default ColorFillTool;
