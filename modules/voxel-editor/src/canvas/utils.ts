import { vector3ToString } from '@pasta/helper-public';
import * as ndarray from 'ndarray';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../constants/Pixels';

export function rgbToHex({ r, g, b }) {
  return (1 << 24) | (r << 16) | (g << 8) | b;
}

export const voxelMapToArray = (() => {
  function generate(lo, hi, fn) {
    var dims = [hi[2]-lo[2], hi[1]-lo[1], hi[0]-lo[0]];
    var data = ndarray(new Uint32Array(dims[2] * dims[1] * dims[0]), dims)
    for (var k = lo[2]; k < hi[2]; k++)
    for (var j = lo[1]; j < hi[1]; j++)
    for(var i = lo[0]; i < hi[0]; i++) {
      data.set(k-lo[2], j-lo[1], i-lo[0], fn(i, j, k))
    }
    return data;
  }

  return function (map): ndarray.Ndarray {
    return generate([1, 1, 1], [GRID_SIZE + 1, GRID_SIZE + 1, GRID_SIZE + 1], (i, j, k) => {
      const key = vector3ToString({ x: i, y: j, z: k });
      const v = map.get(key);
      if (!v) { return 0; }
      return rgbToHex(v.color);
    });
  };
})();

export function toAbsPos(screenPos) {
  return {
    x: GRID_SIZE / 2 + (screenPos.x + UNIT_PIXEL) / BOX_SIZE,
    y: (screenPos.y - PLANE_Y_OFFSET + UNIT_PIXEL) / BOX_SIZE,
    z: GRID_SIZE / 2 + (screenPos.z + UNIT_PIXEL) / BOX_SIZE,
  };
}

export function toScreenPos(absPos) {
  return {
    x: absPos.x * BOX_SIZE - UNIT_PIXEL - GRID_SIZE / 2 * BOX_SIZE,
    y: absPos.y * BOX_SIZE - UNIT_PIXEL + PLANE_Y_OFFSET,
    z: absPos.z * BOX_SIZE - UNIT_PIXEL - GRID_SIZE / 2 * BOX_SIZE,
  };
}
