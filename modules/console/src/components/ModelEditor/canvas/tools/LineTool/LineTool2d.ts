import LineTool from './LineTool';
import { AddBlockToolProps } from '../AddBlockTool';

import {
  Volumn,
  Color,
  ToolType,
  ModelEditorState,
  Axis,
} from '../../../types';

import {
  voxelAddBatch2d,
} from '../../../actions';

interface LineTool2dProps extends AddBlockToolProps {
  mode2d: {
    axis: Axis;
    position: number;
  }
}

class LineTool2d extends LineTool<LineTool2dProps> {
  getParams() {
    return {
      getInteractables: () => [
        this.canvas.component.mode2dPlaneMesh
      ],
      interactablesAreRotated: true,
    };
  }

  mapParamsToProps(state: ModelEditorState) {
    return {
      size: state.file.present.data.size,
      color: state.common.paletteColor,
      fragment: state.file.present.data.fragment,
      mode2d: state.file.present.data.mode2d,
    };
  }

  onDragEnter() {
    switch(this.props.mode2d.axis) {
      case Axis.X: {
        this.drawGuideX.visible = false;
        this.drawGuideY.visible = true;
        this.drawGuideZ.visible = true;
        break;
      }
      case Axis.Y: {
        this.drawGuideX.visible = true;
        this.drawGuideY.visible = false;
        this.drawGuideZ.visible = true;
        break;
      }
      case Axis.Z: {
        this.drawGuideX.visible = true;
        this.drawGuideY.visible = true;
        this.drawGuideZ.visible = false;
        break;
      }
    }
  }

  getAction(volumn: Volumn, color: Color) {
    return voxelAddBatch2d(volumn, color);
  }
}

export default LineTool2d;
