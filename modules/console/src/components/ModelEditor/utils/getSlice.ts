import ndarray from 'ndarray';
const invariant = require('fbjs/lib/invariant');

import {
  Axis,
} from '../types';

function getSlice(axis: Axis, position: number, array: ndarray.Ndarray): ndarray.Ndarray {
  if (array.shape[axis] === 1 && position === 0) return array;

  const shape = array.shape.slice();
  shape[axis] = 1;
  const offset = array.offset + position * array.stride[axis];

  return ndarray(array.data, shape, array.stride, offset);
}

export default getSlice;
