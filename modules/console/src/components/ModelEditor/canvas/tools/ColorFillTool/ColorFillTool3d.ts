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
  voxelColorFill3d,
} from '../../../actions';

class ColorFillTool3d extends ColorFillTool {
  getToolType(): ToolType { return ToolType.COLOR_FILL_3D; }

  getParams(): ColorFillToolParams {
    return {
      interactablesAreRotated: false,
      getInteractables: () => [
        this.canvas.component.modelMesh,
        this.canvas.component.fragmentMesh,
      ],
    };
  }

  getAction(position: THREE.Vector3, color: Color) {
    return voxelColorFill3d(position.x, position.y, position.z, color);
  }
}

export default ColorFillTool3d;
