import * as THREE from 'three';
import {
  ToolType,
} from '../../../types';
import {
  voxelMaginWand,
} from '../../../actions';

import MagicWandTool, { MagicWandToolParams } from './MagicWandTool';

class MagicWandTool3d extends MagicWandTool {
  getParams(): MagicWandToolParams {
    return {
      getInteractables: () => [
        this.canvas.component.modelMesh,
        this.canvas.component.fragmentMesh,
      ],
    };
  }

  getAction(position: THREE.Vector3, merge: boolean) {
    return voxelMaginWand(position.x, position.y, position.z, merge);
  }
}

export default MagicWandTool3d;
