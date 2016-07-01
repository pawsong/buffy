import {
  ToolType,
} from '../../../types';

import EraseTool from './EraseTool';

class EraseTool2d extends EraseTool {
  getToolType(): ToolType { return ToolType.ERASE_2D; }

  getParams() {
    return {
      getInteractables: () => [
        this.canvas.component.model2DSliceMesh,
      ],
    };
  }
}

export default EraseTool2d;
