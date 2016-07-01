import {
  ToolType,
  Position,
  Color,
} from '../../../types';

import {
  voxelPaint2d,
} from '../../../actions';

import PaintTool from './PaintTool';

class PaintTool2d extends PaintTool {
  getToolType(): ToolType { return ToolType.PAINT_2D; }

  getParams() {
    return {
      getInteractables: () => [
        this.canvas.component.model2DSliceMesh,
      ],
    };
  }

  getAction(trace: Position[], color: Color) {
    return voxelPaint2d(trace, color);
  }
}

export default PaintTool2d;
