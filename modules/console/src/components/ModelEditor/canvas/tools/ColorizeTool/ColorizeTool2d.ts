import * as THREE from 'three';

import {
  ToolType,
} from '../../../types';

import ColorizeTool from './ColorizeTool';

class ColorizeTool2d extends ColorizeTool {
  getParams() {
    return {
      getInteractables: () => [
        this.canvas.component.modelMesh,
        this.canvas.component.model2DSliceMesh,
      ],
      hitTest: (intersect: THREE.Intersection, meshPosition: THREE.Vector3) => {
        if (intersect.object === this.canvas.component.model2DSliceMesh) return true;

        const pos = this.canvas.component.mode2dClippingPlane.normal.dot(meshPosition);
        return this.canvas.component.mode2dClippingPlane.constant > - pos;
      },
    };
  }
}

export default ColorizeTool2d;
