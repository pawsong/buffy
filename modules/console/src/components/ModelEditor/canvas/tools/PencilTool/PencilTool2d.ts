import THREE from 'three';

import {
  PIXEL_SCALE,
} from '../../../../../canvas/Constants';

import {
  ToolType,
  Position,
  Color,
} from '../../../types';

import {
  voxelAddList2d,
} from '../../../actions';

import PencilTool from './PencilTool';

class PencilTool2d extends PencilTool {
  getToolType(): ToolType { return ToolType.PENCIL_2D; }

  getParams() {
    const origin = new THREE.Vector3();
    const offset = new THREE.Vector3();

    return {
      cursorOnFace: false,
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

  getAction(trace: Position[], color: Color) {
    return voxelAddList2d(trace, color);
  }
}

export default PencilTool2d;
