import THREE from 'three';

import {
  PIXEL_SCALE,
} from '../../../../../canvas/Constants';

import {
  ToolType,
} from '../../../types';
import {
  voxelMaginWand2d,
} from '../../../actions';

import MagicWandTool, { MagicWandToolParams } from './MagicWandTool';

class MagicWandTool2d extends MagicWandTool {
  getParams(): MagicWandToolParams {
    return {
      getInteractables: () => [
        this.canvas.component.model2DSliceMesh,
      ],
    };
  }

  getAction(position: THREE.Vector3, merge: boolean) {
    return voxelMaginWand2d(position.x, position.y, position.z, merge);
  }
}

export default MagicWandTool2d;
