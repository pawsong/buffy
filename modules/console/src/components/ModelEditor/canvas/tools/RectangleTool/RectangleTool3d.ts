import RectangleTool from './RectangleTool';

import {
  voxelAddBatch3d,
} from '../../../actions';

import { Volumn, Color } from '../../../types';

class RectangleTool3d extends RectangleTool {
  getParams() {
    return {
      getInteractables: () => [
        this.canvas.component.plane,
        this.canvas.component.modelMesh,
        this.canvas.component.fragmentMesh,
      ],
      interactablesAreRotated: false,
    };
  }

  getAction(volumn: Volumn, color: Color) {
    return voxelAddBatch3d(volumn, color);
  }
}

export default RectangleTool3d;
