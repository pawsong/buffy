import THREE from 'three';

import store, {
  actions,
} from '../../store';

import highlightVoxel from './highlightVoxel';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../../constants/Pixels';

function toAbsPos(screenPos) {
  return {
    x: GRID_SIZE / 2 + (screenPos.z + UNIT_PIXEL) / BOX_SIZE,
    y: GRID_SIZE / 2 + (screenPos.x + UNIT_PIXEL) / BOX_SIZE,
    z: (screenPos.y - PLANE_Y_OFFSET + UNIT_PIXEL) / BOX_SIZE,
  };
}

export default [
  highlightVoxel,

  ({
    container,
    voxels,
    interact,
    render,
  }) => {
    return {
      onMouseUp({
        event,
        intersect,
      }) {
        if (!intersect) { return; }
        if (!intersect.object.isVoxel) { return; }

        const normal = intersect.face.normal;
        const position = new THREE.Vector3().subVectors(intersect.point, normal);

        const screenPos = {
          x: Math.floor( position.x / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
          y: Math.floor( position.y / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
          z: Math.floor( position.z / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
        };

        actions.removeVoxel(toAbsPos(screenPos));
      },
    };
  },
]
