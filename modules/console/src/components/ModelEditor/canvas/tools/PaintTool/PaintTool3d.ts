import {
  ToolType,
  Position,
  Color,
} from '../../../types';

import {
  voxelPaint3d,
} from '../../../actions';

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

  getAction(trace: Position[], color: Color) {
    return voxelPaint3d(trace, color);
  }
}

export default PaintTool3d;
