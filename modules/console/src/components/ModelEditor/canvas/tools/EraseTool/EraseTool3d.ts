import {
  ToolType,
  Position,
} from '../../../types';

import {
  voxelRemoveList3d,
} from '../../../actions';

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

  getAction(trace: Position[]) {
    return voxelRemoveList3d(trace);
  }
}

export default EraseTool3d;
