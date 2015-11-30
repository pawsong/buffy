import Voxel from '../Voxel';
import THREE from 'three';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../../constants/Pixels';

const cube = new THREE.CubeGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);

export default ({
  container,
  voxels,
  scene,
}) => {
  const cursor = new Voxel(scene);

  return {
    onInteract({
      intersect,
    }) {
      cursor.hide();

      if (!intersect) { return; }
      if (!intersect.object.isVoxel) { return; }

      const normal = intersect.face.normal;
      const position = new THREE.Vector3().subVectors( intersect.point, normal )
      cursor.move({
        x: Math.floor( position.x / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
        y: Math.floor( position.y / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
        z: Math.floor( position.z / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
      });
    },

    onLeave() {
      cursor.hide();
    },
  };
};
