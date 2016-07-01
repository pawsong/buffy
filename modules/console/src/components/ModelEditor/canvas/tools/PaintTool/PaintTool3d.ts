import {
  ToolType,
} from '../../../types';

import PaintTool from './PaintTool';

class PaintTool3d extends PaintTool {
  getToolType(): ToolType { return ToolType.PAINT_3D; }

  getParams() {
    return {
      getInteractables: () => [
        this.canvas.component.modelMesh,
        this.canvas.component.fragmentMesh,
      ],
    };
  }
}

export default PaintTool3d;
