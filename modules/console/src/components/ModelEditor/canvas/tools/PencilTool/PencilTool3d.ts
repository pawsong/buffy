import {
  ToolType,
  Position,
  Color,
} from '../../../types';

import PencilTool from './PencilTool';

import {
  voxelAddList3d,
} from '../../../actions';

class PencilTool3d extends PencilTool {
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

  getAction(trace: Position[], color: Color) {
    return voxelAddList3d(trace, color);
  }
}

export default PencilTool3d;
