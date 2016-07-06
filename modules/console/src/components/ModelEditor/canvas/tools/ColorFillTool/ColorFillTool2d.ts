import THREE from 'three';

import ColorFillTool, { ColorFillToolParams } from './ColorFillTool';
import {
  Color,
  ToolType,
} from '../../../types';

import {
  PIXEL_SCALE,
} from '../../../../../canvas/Constants';

import {
  voxelColorFill2d,
} from '../../../actions';

class ColorFillTool2d extends ColorFillTool {
  getParams(): ColorFillToolParams {
    const origin = new THREE.Vector3();
    const offset = new THREE.Vector3();

    return {
      interactablesAreRotated: true,
      getInteractables: () => [
        this.canvas.component.mode2dPlaneMesh,
        this.canvas.component.model2DSliceMesh,
      ],
      getOffset: (intersect, normal) => intersect.object === this.canvas.component.mode2dPlaneMesh
        ? offset.copy(normal).multiplyScalar(PIXEL_SCALE)
        : origin,
    };
  }

  getAction(position: THREE.Vector3, color: Color) {
    return voxelColorFill2d(position.x, position.y, position.z, color);
  }
}

export default ColorFillTool2d;
