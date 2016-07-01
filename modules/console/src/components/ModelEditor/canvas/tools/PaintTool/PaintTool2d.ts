import {
  ToolType,
} from '../../../types';

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
}

export default PaintTool2d;
