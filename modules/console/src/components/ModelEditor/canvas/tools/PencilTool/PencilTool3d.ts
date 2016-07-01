import {
  ToolType,
} from '../../../types';

import PencilTool from './PencilTool';

class PencilTool3d extends PencilTool {
  getToolType(): ToolType { return ToolType.PENCIL_3D; }

  getParams() {
    return {
      cursorOnFace: true,
      interactablesAreRotated: false,
      getInteractables: () => [
        this.canvas.component.plane,
        this.canvas.component.modelMesh,
        this.canvas.component.fragmentMesh,
      ],
    };
  }
}

export default PencilTool3d;
