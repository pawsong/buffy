import {
  ToolType,
  Position,
} from '../../../types';

import {
  voxelRemoveList2d,
} from '../../../actions';

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

  getAction(trace: Position[]) {
    return voxelRemoveList2d(trace);
  }
}

export default EraseTool2d;
