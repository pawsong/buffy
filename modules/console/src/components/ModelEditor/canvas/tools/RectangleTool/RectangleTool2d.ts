import RectangleTool from './RectangleTool';

import {
  voxelAddBatch2d,
} from '../../../actions';

import { Volumn, Color } from '../../../types';

class RectangleTool2d extends RectangleTool {
  getParams() {
    return {
      getInteractables: () => [
        this.canvas.component.mode2dPlaneMesh
      ],
      interactablesAreRotated: true,
    };
  }

  getAction(volumn: Volumn, color: Color) {
    return voxelAddBatch2d(volumn, color);
  }
}

export default RectangleTool2d;
