import * as ndarray from 'ndarray';
import * as Immutable from 'immutable';

import { Position } from '../types';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../constants/Pixels';

export function rgbToHex({ r, g, b }) {
  return (1 << 24) /* Used by mesher */ | (r << 16) | (g << 8) | b;
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
      const key = Immutable.Iterable([i, j, k]);
      const v = map.get(key);
      if (!v) { return 0; }
      return rgbToHex(v.color);
    });
  };
})();

export function toAbsPos(screenPos: Position): Position {
  return [
    GRID_SIZE / 2 + (screenPos[0] + UNIT_PIXEL) / BOX_SIZE,
    (screenPos[1] - PLANE_Y_OFFSET + UNIT_PIXEL) / BOX_SIZE,
    GRID_SIZE / 2 + (screenPos[2] + UNIT_PIXEL) / BOX_SIZE,
  ];
}

export function toScreenPos(absPos: Position): Position {
  return [
    absPos[0] * BOX_SIZE - UNIT_PIXEL - GRID_SIZE / 2 * BOX_SIZE,
    absPos[1] * BOX_SIZE - UNIT_PIXEL + PLANE_Y_OFFSET,
    absPos[2] * BOX_SIZE - UNIT_PIXEL - GRID_SIZE / 2 * BOX_SIZE,
  ];
}
