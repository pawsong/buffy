import ndarray from 'ndarray';
const invariant = require('fbjs/lib/invariant');

import {
  Axis,
} from '../types';

function getSlice(axis: Axis, position: number, array: ndarray.Ndarray): ndarray.Ndarray {
  let shape: [number, number, number];
  let offset: number;

  switch(axis) {
    case Axis.X: {
      shape = [1, array.shape[1], array.shape[2]];
      offset = position * array.stride[0];
      break;
    }
    case Axis.Y: {
      shape = [array.shape[0], 1, array.shape[2]];
      offset = position * array.stride[1];
      break;
    }
    case Axis.Z: {
      shape = [array.shape[0], array.shape[1], 1];
      offset = position * array.stride[2];
      break;
    }
    default: {
      invariant(false, `invalid axis: ${axis}`);
    }
  }

  return ndarray(array.data, shape, array.stride, offset);
}

export default getSlice;
