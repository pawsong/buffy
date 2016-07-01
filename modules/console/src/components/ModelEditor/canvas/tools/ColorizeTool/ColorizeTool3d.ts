import {
  ToolType,
} from '../../../types';

import ColorizeTool from './ColorizeTool';

class ColorizeTool3d extends ColorizeTool {
  getToolType(): ToolType { return ToolType.COLORIZE_3D; }

  getParams() {
    return {
      getInteractables: () => [
        this.canvas.component.modelMesh,
      ],
    }
  }
}

export default ColorizeTool3d;
