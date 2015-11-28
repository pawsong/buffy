import store, {
  actions,
} from '../../store';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../../constants/Pixels';

import Brush from '../Brush';

import highlightVoxel from './highlightVoxel';

export default [
  ({
    container,
    scene,
    voxels,
  }) => {
    const brush = new Brush(scene);

    return {
      onInteract({
        intersect,
      }) {
        if (!intersect) {
          brush.hide();
          return;
        }

        var normal = intersect.face.normal;
        var position = new THREE.Vector3().addVectors( intersect.point, normal )

        brush.move({
          x: Math.floor( position.x / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
          y: Math.floor( position.y / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
          z: Math.floor( position.z / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
        });
      },

      onMouseUp({
        intersect,
      }) {
        if (brush.isVisible()) {
          const { color } = store.getState();
          const absPos = voxels.toAbsPos(brush.position);
          actions.addVoxel(absPos, color);
        }
      },

      onLeave() {
        brush.hide();
      },
    };
  },
]
