import {
  ToolType,
} from '../../../types';

import EraseTool from './EraseTool';

class EraseTool3d extends EraseTool {
  getToolType(): ToolType { return ToolType.ERASE_3D; }

  getParams() {
    return {
      getInteractables: () => [
        this.canvas.component.modelMesh,
        this.canvas.component.fragmentMesh,
      ],
    };
  }
}

export default EraseTool3d;
